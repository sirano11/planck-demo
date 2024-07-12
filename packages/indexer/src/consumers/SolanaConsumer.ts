import { mintTo } from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import { HDKey } from 'micro-ed25519-hdkey';
import { ERC20Mock__factory } from 'planck-demo-contracts/typechain/factories/ERC20Mock__factory';
import { Hub__factory } from 'planck-demo-contracts/typechain/factories/Hub__factory';
import { createClient } from 'redis';

import { Config } from '@/config';

import { BaseConsumer, ChainIdentifier, Tx } from './Consumer';

const SOL2ETH_ASSET_PAIRS: Record<string, string> = {
  abcdef: '0x1234', // FIXME: replace with real address
};

const ETH2SOL_ASSET_PAIRS: Record<string, string> = {
  '0x1234': 'abcdef', // FIXME: replace with real address
};

const mnemonicToKeypair = (mnemonic: string) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic, '');
  const hd = HDKey.fromMasterSeed(seed.toString('hex'));
  const path = `m/44'/501'/0'/0'`;
  return Keypair.fromSeed(hd.derive(path).privateKey);
};

export class SolanaConsumer extends BaseConsumer {
  connection: Connection;
  ethersProvider: ethers.providers.JsonRpcProvider;
  /** keypair who has authority of minting solana tokens */
  mintKeypair: Keypair;
  /** wallet who owns Hub contract */
  hubOwnerSigner: ethers.Wallet;
  private static instance: SolanaConsumer;

  constructor() {
    const redisClient = createClient({ url: Config.REDIS_URL });
    super(redisClient, ChainIdentifier.Sui);

    this.connection = new Connection(Config.SOLANA_RPC_ENDPOINT);
    this.mintKeypair = mnemonicToKeypair(Config.SOLANA_MINT_MNEMONIC);
    this.ethersProvider = new ethers.providers.JsonRpcProvider(
      Config.ETH_RPC_ENDPOINT,
    );
    this.hubOwnerSigner = ethers.Wallet.fromMnemonic(Config.HUB_OWNER_MNEMONIC);
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    return new SolanaConsumer();
  }

  public async processTx(tx: Tx) {
    const { asset, sender, data } = tx;

    const actorMnemonic = await this.getMnemonic(tx.sender);
    if (!actorMnemonic) {
      throw new Error('Mnemonic not found');
    }
    const actorKeypair = mnemonicToKeypair(actorMnemonic);

    // mint `asset.address` of `asset.amount` on Solana to actorAddress
    const mintTxSignature = await mintTo(
      this.connection,
      this.mintKeypair,
      new PublicKey(ETH2SOL_ASSET_PAIRS[asset.address]),
      actorKeypair.publicKey,
      this.mintKeypair.publicKey,
      asset.amount.toBigInt(),
    );
    console.log(mintTxSignature);

    // sign with actor
    const transaction = Transaction.from(Buffer.from(data));
    transaction.sign(actorKeypair);

    // send transaction
    const rawTxSignature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [actorKeypair],
    );

    const rawTxResponse = await this.connection.getTransaction(rawTxSignature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!rawTxResponse) {
      throw new Error('Transaction not found');
    }

    // mint output asset in Ethereum
    if (rawTxResponse.meta && rawTxResponse.meta.postTokenBalances) {
      const { preTokenBalances, postTokenBalances } = rawTxResponse.meta;

      let mintDelta: { address: string; amount: bigint }[] = [];
      let remainedDelta: { address: string; amount: bigint }[] = [];
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
}
