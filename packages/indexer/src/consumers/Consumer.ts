import { BigNumber } from 'ethers';
import * as redis from 'redis';

export type RedisClient = ReturnType<typeof redis.createClient>;

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

  public async processTx(tx: Tx) {
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
