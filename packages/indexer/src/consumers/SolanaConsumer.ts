import { mintTo } from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  TokenBalance,
  VersionedTransaction,
} from '@solana/web3.js';
import * as bip39 from 'bip39';
import { Job } from 'bullmq';
import { ethers } from 'ethers';
import { HDKey } from 'micro-ed25519-hdkey';
import { ERC20Mock__factory } from 'planck-demo-contracts/typechain/factories/ERC20Mock__factory';
import { Hub__factory } from 'planck-demo-contracts/typechain/factories/Hub__factory';
import { createClient } from 'redis';

import { Config, connection } from '@/config';

import { BaseConsumer, ChainIdentifier, Tx } from './Consumer';

const SOL2ETH_ASSET_PAIRS: Record<string, string> = {
  abcdef: '0x1234', // FIXME: replace with real address
};

const ETH2SOL_ASSET_PAIRS: Record<string, string> = {
  '0x1234': 'abcdef', // FIXME: replace with real address
};

const getKeypairFromMnemonic = (mnemonic: string): Keypair => {
  const seed = bip39.mnemonicToSeedSync(mnemonic, '');
  const hd = HDKey.fromMasterSeed(seed.toString('hex'));
  const path = `m/44'/501'/0'/0'`;
  return Keypair.fromSeed(hd.derive(path).privateKey);
};

const fromHexString = (hexString: string) =>
  Uint8Array.from(
    hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );

export class SolanaConsumer extends BaseConsumer {
  private static instance: SolanaConsumer;
  connection: Connection;
  ethersProvider: ethers.providers.JsonRpcProvider;
  /** keypair who has authority of minting solana tokens */
  mintKeypair: Keypair;
  /** wallet who owns Hub contract */
  hubOwnerSigner: ethers.Wallet;

  constructor() {
    const redisClient = createClient({ url: Config.REDIS_URL });
    super(redisClient, ChainIdentifier.Sui);

    this.connection = new Connection(Config.SOLANA_RPC_ENDPOINT);
    this.mintKeypair = getKeypairFromMnemonic(Config.SOLANA_MINT_MNEMONIC);
    this.ethersProvider = new ethers.providers.JsonRpcProvider(
      Config.ETH_HTTP_ENDPOINT,
    );

    this.hubOwnerSigner = new ethers.Wallet(
      Config.HUB_OWNER_PRIVATE_KEY,
      this.ethersProvider,
    );
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    return new SolanaConsumer();
  }

  async getKeypair(ethAddress: string): Promise<Keypair | null> {
    const mnemonic = await this.getMnemonic(ethAddress);
    return mnemonic ? getKeypairFromMnemonic(mnemonic) : null;
  }

  public async processTx(job: Job) {
    const tx = job.data as Tx;
    const { asset, sender, data } = tx;
    const assetAmount = BigInt(asset.amount);

    await job.updateProgress({ status: 'event-received' });

    const actorKeypair = await this.getKeypair(sender);
    if (!actorKeypair) {
      throw new Error('actor-not-found');
    }

    // mint `asset.address` of `asset.amount` on Solana to actorAddress
    try {
      const mintTxSignature = await mintTo(
        this.connection,
        this.mintKeypair,
        new PublicKey(ETH2SOL_ASSET_PAIRS[asset.address]),
        actorKeypair.publicKey,
        this.mintKeypair.publicKey,
        assetAmount,
      );
      console.log(mintTxSignature);
      await job.updateProgress({ status: 'mint-asset-to-actor' });
    } catch (e) {
      console.error(e);
      throw new Error('mint-asset-to-actor');
    }

    // sign with actor
    const tx_bytes = fromHexString(data);
    const transaction = VersionedTransaction.deserialize(tx_bytes.slice(1));

    transaction.sign([actorKeypair]);

    // send transaction
    let txSignature: string | undefined;
    try {
      txSignature = await connection.sendTransaction(transaction);
      await job.updateProgress({ status: 'send-tx-to-dest' });
    } catch (e) {
      console.error(e);
      throw new Error('send-tx-to-dest');
    }

    const rawTxResponse = await this.connection.getTransaction(txSignature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!rawTxResponse) {
      throw new Error('tx-not-found');
    }

    // mint output asset in Ethereum
    try {
      await this.postProcessTokens(
        tx,
        rawTxResponse?.meta?.preTokenBalances,
        rawTxResponse?.meta?.postTokenBalances,
        rawTxResponse?.meta?.err !== null,
      );
      await job.updateProgress({ status: 'mint-asset-to-sender' });
    } catch (e) {
      console.error(e);
      throw new Error('mint-asset-to-sender');
    }
  }

  private async postProcessTokens(
    { asset, sender }: Tx,
    preTokenBalances: TokenBalance[] | undefined | null,
    postTokenBalances: TokenBalance[] | undefined | null,
    error: boolean,
  ) {
    let mintDelta: { address: string; amount: bigint }[] = [];
    let remainedDelta: { address: string; amount: bigint }[] = [];

    if (postTokenBalances) {
      postTokenBalances.forEach((post) => {
        const preAmount = BigInt(
          preTokenBalances?.find(
            ({ accountIndex }) => accountIndex === post.accountIndex,
          )?.uiTokenAmount.amount || 0,
        );
        const postAmount = BigInt(post.uiTokenAmount.amount);

        if (postAmount > preAmount && post.mint in SOL2ETH_ASSET_PAIRS) {
          mintDelta.push({
            address: SOL2ETH_ASSET_PAIRS[post.mint],
            amount: postAmount - preAmount,
          });
        } else if (
          postAmount < preAmount &&
          asset.address in ETH2SOL_ASSET_PAIRS
        ) {
          remainedDelta.push({
            address: asset.address,
            amount: preAmount - postAmount,
          });
        }
      });
    } else if (!preTokenBalances && !postTokenBalances && error) {
      remainedDelta.push({
        address: asset.address,
        amount: BigInt(asset.amount),
      });
    }

    const hubContract = Hub__factory.connect(
      Config.CONTRACT_ADDRESS_HUB,
      this.hubOwnerSigner,
    );

    for (const balance of mintDelta) {
      const erc20Contract = ERC20Mock__factory.connect(
        balance.address,
        this.ethersProvider,
      );
      await (await erc20Contract.mint(sender, balance.amount)).wait();
    }

    for (const balance of remainedDelta) {
      await (
        await hubContract.transfer(sender, balance.address, balance.amount)
      ).wait();
    }
  }
}
