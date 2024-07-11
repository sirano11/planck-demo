import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { BigNumber } from 'ethers';
import { HDKey } from 'micro-ed25519-hdkey';
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

  protected async getKeyPair(
    ethAddress: string,
  ): Promise<Keypair | Ed25519Keypair | null> {
    const mnemonics = await this.getMnemonic(ethAddress);

    if (!mnemonics) {
      return null;
    }

    if (this.chain === ChainIdentifier.Sui) {
      return Ed25519Keypair.deriveKeypair(mnemonics);
    } else if (this.chain === ChainIdentifier.Solana) {
      const seed = bip39.mnemonicToSeedSync(mnemonics, '');
      const hd = HDKey.fromMasterSeed(seed.toString('hex'));
      const path = `m/44'/501'/0'/0'`;
      return Keypair.fromSeed(hd.derive(path).privateKey);
    } else {
      return null;
    }
  }

  private async connectRedis() {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
    }
  }
}
