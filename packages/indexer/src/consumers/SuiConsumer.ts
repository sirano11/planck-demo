import { fromHEX, toHEX } from '@mysten/bcs';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { SuiTransactionBlockResponse } from '@mysten/sui/client';
import { Keypair } from '@mysten/sui/cryptography';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { BigNumber, ethers } from 'ethers';
import { BridgeToken__factory } from 'planck-demo-contracts/typechain/factories/BridgeToken__factory';
import { Hub__factory } from 'planck-demo-contracts/typechain/factories/Hub__factory';
import { CONTRACTS } from 'planck-demo-interface/src/constants/contracts';
import { CUSTODY, PROTOCOL } from 'planck-demo-interface/src/helper/sui/config';
import { createClient } from 'redis';

import { Config } from '@/config';

import { Asset, BaseConsumer, ChainIdentifier, Tx } from './Consumer';

const addressToCoinType = new Map<string, string>([
  [CUSTODY.TYPE_ARGUMENT.BTC, CONTRACTS.wBTC],
  [PROTOCOL.TYPE_ARGUMENT.LIQUID_MINT, CONTRACTS.lMINT],
  [PROTOCOL.TYPE_ARGUMENT.CASH_JPY, CONTRACTS.cashJPY],
  [PROTOCOL.TYPE_ARGUMENT.CASH_KRW, CONTRACTS.cashKRW],
  [PROTOCOL.TYPE_ARGUMENT.CASH_LIVRE, CONTRACTS.cashLIVRE],
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
      Config.ETH_RPC_ENDPOINT,
    );
    this.ethSigner = ethers.Wallet.fromMnemonic(
      Config.HUB_OWNER_MNEMONIC,
    ).connect(ethProvider);
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    return new SuiConsumer();
  }

  public async processTx(tx: Tx) {
    try {
      const { asset, chain, sender, data } = tx;
      const keypair = (await this.getKeyPair(sender)) as Ed25519Keypair;

      const rawSuiTx = fromHEX(data);
      const suiTx = Transaction.fromKind(rawSuiTx);

      suiTx.setSender(keypair.toSuiAddress());
      const result = await this.suiClient.signAndExecuteTransaction({
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

      await this.postProcess(tx, result);
    } catch (e) {
      console.log(e);
    }
  }

  public async postProcess(tx: Tx, result: SuiTransactionBlockResponse) {
    const mintInfo: { address: string; amount: BigNumber }[] = [];
    const payBackInfo: {
      address: string;
      sender: string;
      amount: BigNumber;
    }[] = [];

    // It needs to pay back to asset from Hub contract to user.
    if (result.effects?.status.status === 'failure') {
      payBackInfo.push({
        address: tx.asset.address,
        sender: tx.sender,
        amount: tx.asset.amount,
      });
    } else {
      if (result.balanceChanges) {
        for (const balance of result.balanceChanges) {
          // Do not consider about sui coin.
          if (balance.coinType === `0x2::sui::SUI`) {
            continue;
          }

          const changedAmount = BigNumber.from(balance.amount);
          if (changedAmount.isNegative()) {
            // When executing the btc_to_lmint or lmint_to_btc, it returned back used coin object as parameter.
            // So it needs to pay back reamaind amount to user from lock asset.
            if (
              (balance.coinType === PROTOCOL.TYPE_ARGUMENT.LIQUID_MINT &&
                tx.asset.address === CONTRACTS.lMINT) ||
              (balance.coinType === CUSTODY.TYPE_ARGUMENT.BTC &&
                tx.asset.address === CONTRACTS.wBTC)
            ) {
              const returnedAmount = tx.asset.amount.add(changedAmount);
              if (returnedAmount.gt(BigNumber.from(0))) {
                payBackInfo.push({
                  address: tx.asset.address,
                  sender: tx.sender,
                  amount: returnedAmount,
                });
              }
            }
          } else {
            const address = addressToCoinType.get(balance.coinType);
            if (address) {
              mintInfo.push({ address, amount: tx.asset.amount });
            }
          }
        }

        for (const info of payBackInfo) {
          const hubContract = Hub__factory.connect(
            CONTRACTS.Hub,
            this.ethSigner,
          );
          const receipt = await (
            await hubContract.transfer(info.sender, info.address, info.amount)
          ).wait();

          if (!receipt.status) {
            throw new Error(
              `Failed to postProcess. hub transfer => address : ${tx.asset.address}, amount :  ${tx.asset.amount}, sender: ${tx.sender}`,
            );
          }
        }

        for (const info of mintInfo) {
          const erc20 = BridgeToken__factory.connect(
            info.address,
            this.ethSigner,
          );

          const receipt = await (
            await erc20.mint(tx.sender, info.amount)
          ).wait();

          if (!receipt.status) {
            throw new Error(
              `Failed to postProcess. mint => address : ${info.address}, amount :  ${info.amount}, sender: ${tx.sender}`,
            );
          }
        }
      }
    }
  }
}
