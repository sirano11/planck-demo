import { Job } from 'bullmq';
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
  amount: string;
}

export interface Tx {
  asset: Asset;
  chain: ChainIdentifier;
  sender: string;
  data: string;
}

type ActorInfo = {
  eth: string;
  sui: string;
  solana: string;
  mnemonic: string;
};

const isObjectEmpty = (obj: object) => {
  return JSON.stringify(obj) === '{}';
};

export class BaseConsumer {
  private redisClient: RedisClient;
  private chain: ChainIdentifier;

  constructor(redisClient: RedisClient, chain: ChainIdentifier) {
    this.redisClient = redisClient;
    this.chain = chain;
  }

  public async processTx(_job: Job) {
    throw new Error('Not implemented');
  }

  public async disconnectRedis() {
    if (this.redisClient.isOpen) {
      await this.redisClient.disconnect();
    }
  }

  protected async getActorAddress(ethAddress: string): Promise<string | null> {
    if (!this.redisClient.isOpen) {
      await this.connectRedis();
    }

    const chainId = {
      [ChainIdentifier.Ethereum]: 'eth',
      [ChainIdentifier.Solana]: 'sol',
      [ChainIdentifier.Sui]: 'sui',
      [ChainIdentifier.TON]: 'ton',
    }[this.chain];

    const address = await this.redisClient.hGet(`eth:${ethAddress}`, chainId);

    return address || null;
  }

  protected async getActorInfo(ethAddress: string): Promise<ActorInfo | null> {
    if (!this.redisClient.isOpen) {
      await this.connectRedis();
    }

    const info = await this.redisClient.hGetAll(`eth:${ethAddress}`);
    return !isObjectEmpty(info) ? (info as ActorInfo) : null;
  }

  protected async getMnemonic(ethAddress: string): Promise<string | null> {
    if (!this.redisClient.isOpen) {
      await this.connectRedis();
    }

    return (
      (await this.redisClient.hGet(`eth:${ethAddress}`, 'mnemonic')) || null
    );
  }

  private async connectRedis() {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
    }
  }
}
