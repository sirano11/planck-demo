import { BigNumber } from 'ethers';

import { RedisClient } from '@/indexers/MsgCommittedIndexer';

export enum ChainIdentifier {
  Ethereum,
  Solana,
  Sui,
  TON,
}

export interface Asset {
  address: string;
  amount: BigNumber;
}

export interface Tx {
  asset: Asset;
  chain: ChainIdentifier;
  sender: string;
  data: string;
}

export class BaseConsumer {
  private txQueue: Tx[] = [];
  private isProcessing: boolean = false;
  private redisClient: RedisClient;
  private chain: ChainIdentifier;

  constructor(redisClient: RedisClient, chain: ChainIdentifier) {
    this.redisClient = redisClient;
    this.chain = chain;
  }

  public enqueue(tx: Tx) {
    this.txQueue.push(tx);

    if (!this.isProcessing) {
      this.processTxs();
    }
  }

  private async processTxs() {
    this.isProcessing = true;

    while (this.txQueue.length > 0) {
      const tx = this.txQueue.shift();
      if (tx) {
        await this.processTx(tx);
      }
    }
  }

  protected async processTx(tx: Tx) {
    throw new Error('Not implemented');
  }

  protected async getActorAddress(sender: string): Promise<string | null> {
    return (
      (await this.redisClient.get(`actor:${this.chain}:${sender}`)) || null
    );
  }

  protected async setActorAddress(sender: string, actor: string) {
    await this.redisClient.set(`actor:${this.chain}:${sender}`, actor);
  }
}
