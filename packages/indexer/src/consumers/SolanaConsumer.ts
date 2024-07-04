import { createClient } from 'redis';

import { Config } from '@/config';

import { BaseConsumer, ChainIdentifier, Tx } from './Consumer';

export class SolanaConsumer extends BaseConsumer {
  private static instance: SolanaConsumer;
  constructor() {
    const redisClient = createClient({ url: Config.REDIS_URL });
    super(redisClient, ChainIdentifier.Sui);
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    return new SolanaConsumer();
  }

  public async processTx(tx: Tx) {
    const { asset, chain, sender, data } = tx;

    const actorAddress = await this.getActorAddress(tx.sender);
    if (!actorAddress) {
      // await this.setActorAddress(
      //   sender,
      //   '0f92eabf01c1a7013ad85e1b871875f56d955e200cbbdedbab344615f37ab2f9',
      // ); // FIXME:
    }

    // TODO: Asset handling
    // mint `asset.address` of `asset.ammount` on Solana

    // TODO: Handle Solana raw tx
  }
}
