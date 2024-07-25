import { fromHEX } from '@mysten/bcs';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { SuiTransactionBlockResponse } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { Job } from 'bullmq';
import { ethers } from 'ethers';
import { BridgeToken__factory } from 'planck-demo-contracts/typechain/factories/BridgeToken__factory';
import { Hub__factory } from 'planck-demo-contracts/typechain/factories/Hub__factory';
import {
  HUB_CONTRACT_ADDRESS,
  TOKEN_ADDRESS,
} from 'planck-demo-interface/src/helper/eth/config';
import { CUSTODY, PROTOCOL } from 'planck-demo-interface/src/helper/sui/config';
import { createClient } from 'redis';

import { Config } from '@/config';

import { BaseConsumer, ChainIdentifier, Tx } from './Consumer';

const addressToCoinType = new Map<string, string>([
  [CUSTODY.TYPE_ARGUMENT.BTC, TOKEN_ADDRESS.wBTC],
  [PROTOCOL.TYPE_ARGUMENT.LIQUID_MINT, TOKEN_ADDRESS.lMINT],
  [PROTOCOL.TYPE_ARGUMENT.CASH_JPY, TOKEN_ADDRESS.cashJPY],
  [PROTOCOL.TYPE_ARGUMENT.CASH_KRW, TOKEN_ADDRESS.cashKRW],
  [PROTOCOL.TYPE_ARGUMENT.CASH_LIVRE, TOKEN_ADDRESS.cashLIVRE],
  [PROTOCOL.TYPE_ARGUMENT.CASH_SDR, TOKEN_ADDRESS.cashSDR],
]);

export class SuiConsumer extends BaseConsumer {
  private static instance: SuiConsumer;

  private suiClient: SuiClient;
  private ethSigner: ethers.Signer;
  constructor() {
    const redisClient = createClient({ url: Config.REDIS_URL });
    super(redisClient, ChainIdentifier.Sui);
    this.suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

    const ethProvider = new ethers.providers.JsonRpcProvider(
      Config.ETH_HTTP_ENDPOINT,
    );

    this.ethSigner = new ethers.Wallet(
      Config.PRIVATE_KEY_SUI_CONSUMER,
      ethProvider,
    );
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    return new SuiConsumer();
  }

  async getKeypair(ethAddress: string): Promise<Ed25519Keypair | null> {
    const mnemonics = await this.getMnemonic(ethAddress);
    return mnemonics ? Ed25519Keypair.deriveKeypair(mnemonics) : null;
  }

  public async processTx(job: Job) {
    const tx = job.data as Tx;
    const { sender, data } = tx;

    let result: SuiTransactionBlockResponse | undefined;
    await job.updateProgress({ status: 'event-received' });

    try {
      const keypair = await this.getKeypair(sender);
      if (!keypair) {
        throw new Error('actor-not-found');
      }

      const rawSuiTx = fromHEX(data);
      const suiTx = Transaction.fromKind(rawSuiTx);

      suiTx.setSender(keypair.toSuiAddress());

      try {
        result = await this.suiClient.signAndExecuteTransaction({
          transaction: suiTx,
          signer: keypair,
          requestType: 'WaitForLocalExecution',
          options: {
            showEffects: true,
            showEvents: true,
            showBalanceChanges: true,
            showObjectChanges: true,
          },
        });
      } catch (e) {
        console.error(e);
        throw new Error('send-tx-to-dest');
      }

      await job.updateProgress({
        status: 'send-tx-to-dest',
        txHash: result.digest,
      });
    } catch (e) {
      try {
        await this.postProcess(tx, false);
        await job.updateProgress({ status: 'give-asset-back-to-sender' });
      } catch (e) {
        console.error(e);
        throw new Error('give-asset-back-to-sender');
      }
      throw e;
    }

    try {
      await this.postProcess(tx, result);
      await job.updateProgress({ status: 'mint-asset-to-sender' });
    } catch (e) {
      console.error(e);
      throw new Error('mint-asset-to-sender');
    }
  }

  public async postProcess(
    { asset, sender }: Tx,
    result: SuiTransactionBlockResponse | false, // false means failure
  ) {
    const mintInfo: { address: string; amount: bigint }[] = [];
    const payBackInfo: {
      address: string;
      sender: string;
      amount: bigint;
    }[] = [];
    const inAmount = BigInt(asset.amount);

    // It needs to pay back to asset from Hub contract to user.
    if (result === false || result.effects?.status.status === 'failure') {
      payBackInfo.push({
        address: asset.address,
        sender: sender,
        amount: BigInt(asset.amount),
      });
    } else {
      if (result.balanceChanges) {
        for (const balance of result.balanceChanges) {
          // Do not consider about sui coin.
          if (balance.coinType === `0x2::sui::SUI`) {
            continue;
          }

          const deltaAmount = BigInt(balance.amount);
          if (deltaAmount < 0) {
            // When executing the btc_to_lmint or lmint_to_btc, it returned back used coin object as parameter.
            // So it needs to pay back remained amount to user from lock asset.
            if (
              balance.coinType === PROTOCOL.TYPE_ARGUMENT.LIQUID_MINT &&
              asset.address === TOKEN_ADDRESS.lMINT
            ) {
              const remainedAmount = inAmount + deltaAmount;
              if (remainedAmount > 0) {
                payBackInfo.push({
                  address: asset.address,
                  sender: sender,
                  amount: remainedAmount,
                });
              }
            }
          } else if (deltaAmount > 0) {
            const address = addressToCoinType.get(balance.coinType);
            if (address) {
              mintInfo.push({ address, amount: deltaAmount });
            }
          }
        }
      }
    }

    for (const info of payBackInfo) {
      const hubContract = Hub__factory.connect(
        HUB_CONTRACT_ADDRESS,
        this.ethSigner,
      );

      console.log(`payback ${info.sender}, ${info.address}, ${info.amount}`);

      const receipt = await (
        await hubContract.transfer(info.sender, info.address, info.amount)
      ).wait();

      if (!receipt.status) {
        throw new Error(
          `Failed to postProcess. hub transfer => address: ${asset.address}, amount: ${asset.amount}, sender: ${sender}`,
        );
      }
    }

    for (const info of mintInfo) {
      const erc20 = BridgeToken__factory.connect(info.address, this.ethSigner);

      console.log(`mint ${sender}, ${info.address}, ${info.amount}`);

      const receipt = await (await erc20.mint(sender, info.amount)).wait();

      if (!receipt.status) {
        throw new Error(
          `Failed to postProcess. mint => address: ${info.address}, amount: ${info.amount}, sender: ${sender}`,
        );
      }
    }
  }
}
