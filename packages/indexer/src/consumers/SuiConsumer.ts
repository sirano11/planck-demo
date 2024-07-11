import { fromHEX, toHEX } from '@mysten/bcs';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { SuiTransactionBlockResponse } from '@mysten/sui/client';
import { Keypair } from '@mysten/sui/cryptography';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { BigNumber, ethers } from 'ethers';
import { createClient } from 'redis';

import { Config } from '@/config';

import { Asset, BaseConsumer, ChainIdentifier, Tx } from './Consumer';

export class SuiConsumer extends BaseConsumer {
  private static instance: SuiConsumer;
  private suiClient: SuiClient;
  constructor() {
    const redisClient = createClient({ url: Config.REDIS_URL });
    super(redisClient, ChainIdentifier.Sui);
    this.suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
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

      console.log(result);
    } catch (e) {
      console.log(e);
    }
  }
}
