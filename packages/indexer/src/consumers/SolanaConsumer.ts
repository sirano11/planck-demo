import { getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  TokenBalance,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import * as bip39 from 'bip39';
import { Job } from 'bullmq';
import { BigNumber, ethers } from 'ethers';
import { HDKey } from 'micro-ed25519-hdkey';
import { ERC20Mock__factory } from 'planck-demo-contracts/typechain/factories/ERC20Mock__factory';
import { Hub__factory } from 'planck-demo-contracts/typechain/factories/Hub__factory';
import { SPL_TOKENS } from 'planck-demo-interface/src/constants/solanaConfigs';
import { TOKEN_ADDRESS } from 'planck-demo-interface/src/helper/eth/config';
import { createClient } from 'redis';

import { Config, connection } from '@/config';

import { BaseConsumer, ChainIdentifier, Tx } from './Consumer';

const SOL2ETH_ASSET_PAIRS: Record<string, string> = {
  [SPL_TOKENS.wSOL.toBase58()]: TOKEN_ADDRESS.wSOL,
  [SPL_TOKENS.wMEME.toBase58()]: TOKEN_ADDRESS.wMEME,
};

const ETH2SOL_ASSET_PAIRS: Record<string, string> = {
  [TOKEN_ADDRESS.wSOL]: SPL_TOKENS.wSOL.toBase58(),
  [TOKEN_ADDRESS.wMEME]: SPL_TOKENS.wMEME.toBase58(),
};

const getKeypairFromMnemonic = (mnemonic: string): Keypair => {
  const seed = bip39.mnemonicToSeedSync(mnemonic, 'mint');
  const hd = HDKey.fromMasterSeed(seed.toString('hex'));
  const path = `m/44'/501'/0'/0'`;
  return Keypair.fromSeed(hd.derive(path).privateKey);
};

const fromHexString = (hexString: string) =>
  Uint8Array.from(
    hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );

const isValidSignature = async (connection: Connection, sig: string) => {
  const status = await connection.getSignatureStatus(sig, {
    searchTransactionHistory: true,
  });
  return (
    status.value?.err === null &&
    status.value?.confirmationStatus === 'confirmed'
  );
};

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
    super(redisClient, ChainIdentifier.Solana);

    this.connection = new Connection(
      Config.SOLANA_DEVNET_RPC_ENDPOINT,
      'confirmed',
    );

    this.mintKeypair = getKeypairFromMnemonic(Config.SOLANA_MINT_MNEMONIC);
    this.ethersProvider = new ethers.providers.JsonRpcProvider(
      Config.ETH_HTTP_ENDPOINT,
    );

    this.hubOwnerSigner = new ethers.Wallet(
      Config.PRIVATE_KEY_SOLANA_CONSUMER,
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
    // const privateKey = await this.getPrivateKey(ethAddress);

    return mnemonic ? getKeypairFromMnemonic(mnemonic) : null;
  }

  public async processTx(job: Job) {
    const tx = job.data as Tx;
    const { asset, sender, data } = tx;
    const assetAmount = BigInt(asset.amount);

    await job.updateProgress({ status: 'event-received' });

    let actorKeypair = await this.getKeypair(sender);
    const actorPrivateKey = await this.getActorAddress(sender);

    if (!(actorKeypair || actorPrivateKey)) {
      console.log(new Error('actor-not-found'));
      // throw new Error('actor-not-found');
      process.exit(1);
    }

    const solAddrBytes = fromHexString(actorPrivateKey!);
    actorKeypair = Keypair.fromSecretKey(solAddrBytes.slice(1));

    const tokenOwner = await getOrCreateAssociatedTokenAccount(
      connection,
      this.mintKeypair,
      new PublicKey(ETH2SOL_ASSET_PAIRS[asset.address]),
      this.mintKeypair.publicKey,
    );

    const tokenReceiver = await getOrCreateAssociatedTokenAccount(
      connection,
      this.mintKeypair,
      new PublicKey(ETH2SOL_ASSET_PAIRS[asset.address]),
      actorKeypair.publicKey,
    );

    // mint `asset.address` of `asset.amount` on Solana to actorAddress
    try {
      const transferTxSignature = await transfer(
        this.connection,
        this.mintKeypair,
        tokenOwner.address,
        tokenReceiver.address,
        this.mintKeypair.publicKey,
        assetAmount,
      );
      console.log('# transferTxSignature:');
      console.log(transferTxSignature);

      await job.updateProgress({ status: 'mint-asset-to-actor' });
    } catch (e) {
      console.error(e);
      throw new Error('mint-asset-to-actor');
    }

    // deserialize committed transaction data
    const tx_bytes = fromHexString(data);
    const transaction = VersionedTransaction.deserialize(tx_bytes.slice(1));

    // decompile transaction and modify its blockhash to latest (since transaction has failed with `Blockhash not found`)
    let swapTxSignature: string | undefined;
    try {
      let txInstructions = TransactionMessage.decompile(
        transaction.message,
      ).instructions;
      const messageV0 = new TransactionMessage({
        payerKey: this.mintKeypair.publicKey,
        recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
        instructions: [...txInstructions],
      }).compileToV0Message();

      // sign with mintKeypair
      const vtx = new VersionedTransaction(messageV0);
      vtx.sign([this.mintKeypair]);

      // send transaction
      swapTxSignature = await this.connection.sendTransaction(vtx, {
        preflightCommitment: 'confirmed',
      });
      console.log('# swapTxSignature');
      console.log(swapTxSignature);

      await job.updateProgress({ status: 'send-tx-to-dest' });
    } catch (e) {
      console.error(e);
      try {
        await this.postProcess(tx, null, null, true);
        await job.updateProgress({ status: 'give-asset-back-to-sender' });
      } catch (e) {
        console.error(e);
        throw new Error('give-asset-back-to-sender');
      }
      throw new Error('send-tx-to-dest');
    }

    this.connection.onSignature(
      swapTxSignature,
      async () => {
        const rawTxResponse = await this.connection.getParsedTransaction(
          swapTxSignature,
          {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          },
        );
        console.log('# rawTxResponse (for debugging purpose)');
        console.log(rawTxResponse);

        const isValid = await isValidSignature(connection, swapTxSignature);

        if (!(rawTxResponse && isValid)) {
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
          console.log('postprocess success!');

          await job.updateProgress({ status: 'mint-asset-to-sender' });
        } catch (e) {
          console.error(e);
          throw new Error('mint-asset-to-sender');
        }
      },
      'confirmed',
    );
  }

  private async postProcess(
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

    // FIXME: unstable processing
    console.log('# postprocess works well? ethereum contract side:');

    for (const balance of mintDelta) {
      const erc20Contract = ERC20Mock__factory.connect(
        balance.address,
        this.hubOwnerSigner,
      );
      console.log('eth_tx_res?');
      let eth_tx_res = await (
        await erc20Contract.mint(sender, balance.amount, {
          gasLimit: BigNumber.from(3305900000000),
          maxFeePerGas: BigNumber.from(32059416604),
        })
      ).wait();
      console.log(eth_tx_res);
    }

    for (const balance of remainedDelta) {
      console.log('eth_tx_res2?');
      const eth_tx_res2 = await (
        await hubContract.transfer(sender, balance.address, balance.amount, {
          gasLimit: BigNumber.from(3305900000000),
          maxFeePerGas: BigNumber.from(32059416604),
        })
      ).wait();
      console.log(eth_tx_res2);
    }
  }
}
