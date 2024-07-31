import { getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token';
import {
  Connection,
  Context,
  Keypair,
  PublicKey,
  SignatureResult,
  TokenBalance,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { Job } from 'bullmq';
import { BigNumber, ethers } from 'ethers';
import { ERC20Mock__factory } from 'planck-demo-contracts/typechain/factories/ERC20Mock__factory';
import { Hub__factory } from 'planck-demo-contracts/typechain/factories/Hub__factory';
import { SPL_TOKENS } from 'planck-demo-interface/src/constants/solanaConfigs';
import { TOKEN_ADDRESS } from 'planck-demo-interface/src/helper/eth/config';
import { createClient } from 'redis';

import { Config, connection } from '@/config';
import { fromHexString, getKeypairFromMnemonic } from '@/utils/solanaUtils';

import { BaseConsumer, ChainIdentifier, Tx } from './Consumer';

const SOL2ETH_ASSET_PAIRS: Record<string, string> = {
  [SPL_TOKENS.wSOL.toBase58()]: TOKEN_ADDRESS.wSOL,
  [SPL_TOKENS.wMEME.toBase58()]: TOKEN_ADDRESS.wMEME,
};

const ETH2SOL_ASSET_PAIRS: Record<string, string> = {
  [TOKEN_ADDRESS.wSOL]: SPL_TOKENS.wSOL.toBase58(),
  [TOKEN_ADDRESS.wMEME]: SPL_TOKENS.wMEME.toBase58(),
};

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
    const redisClient = createClient({
      socket: {
        host: Config.REDIS_HOST,
        port: Config.REDIS_PORT,
      },
    });
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

  waitForConfirmedSignature = (signature: string) =>
    new Promise<{
      signatureResult: SignatureResult;
      context: Context;
    }>((resolve, reject) => {
      const subscriptionId = connection.onSignature(
        signature,
        async (signatureResult, context) => {
          try {
            resolve({ signatureResult, context });
            connection.removeSignatureListener(subscriptionId);
          } catch (error) {
            reject(error);
          }
        },
        'confirmed',
      );
    });

  public async processTx(job: Job) {
    const tx = job.data as Tx;
    const { asset, sender, data } = tx;
    const assetAmount = BigInt(asset.amount);

    await job.updateProgress({ status: 'event-received' });

    let actorKeypair = await this.getKeypair(sender);
    if (!actorKeypair) {
      throw new Error('actor-not-found');
    }

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

      await job.updateProgress({ status: 'mint-asset-to-actor' });
    } catch (e) {
      console.error(e);
      throw new Error('mint-asset-to-actor');
    }

    // deserialize committed transaction data
    const txBytes = fromHexString(data);
    const transaction = VersionedTransaction.deserialize(txBytes.slice(1));

    // decompile transaction and modify its blockhash to latest (since transaction has failed with `Blockhash not found`)
    let swapTxSignature: string | undefined;
    try {
      let txInstructions = TransactionMessage.decompile(
        transaction.message,
      ).instructions;
      const messageV0 = new TransactionMessage({
        payerKey: actorKeypair.publicKey,
        recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
        instructions: [...txInstructions],
      }).compileToV0Message();

      // sign with mintKeypair
      const vtx = new VersionedTransaction(messageV0);
      vtx.sign([actorKeypair]);

      // send transaction
      swapTxSignature = await this.connection.sendTransaction(vtx, {
        preflightCommitment: 'confirmed',
      });

      await job.updateProgress({
        status: 'send-tx-to-dest',
        txHash: swapTxSignature,
      });
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

    await this.waitForConfirmedSignature(swapTxSignature);

    const rawTxResponse = await this.connection.getParsedTransaction(
      swapTxSignature,
      {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      },
    );

    const isValid = await isValidSignature(connection, swapTxSignature);
    if (!(rawTxResponse && isValid)) {
      throw new Error('tx-not-found');
    }

    // Mint output asset in Ethereum
    try {
      await this.postProcess(
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

        if (
          postAmount > preAmount &&
          post.mint in SOL2ETH_ASSET_PAIRS &&
          post.mint !== ETH2SOL_ASSET_PAIRS[asset.address]
        ) {
          mintDelta.push({
            address: SOL2ETH_ASSET_PAIRS[post.mint],
            amount: postAmount - preAmount,
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
        this.hubOwnerSigner,
      );
      let receipt = await (
        await erc20Contract.mint(sender, balance.amount)
      ).wait();
      console.log(receipt);
    }

    for (const balance of remainedDelta) {
      const receipt = await (
        await hubContract.transfer(sender, balance.address, balance.amount)
      ).wait();
      console.log(receipt);
    }
  }
}
