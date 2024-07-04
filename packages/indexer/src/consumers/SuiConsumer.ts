import { createClient } from 'redis';

import { Config } from '@/config';

import { BaseConsumer, ChainIdentifier, Tx } from './Consumer';

export class SuiConsumer extends BaseConsumer {
  private static instance: SuiConsumer;
  constructor() {
    const redisClient = createClient({ url: Config.REDIS_URL });
    super(redisClient, ChainIdentifier.Sui);
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    return new SuiConsumer();
  }

  public async processTx(tx: Tx) {
    const { asset, chain, sender, data } = tx;

    const suiAddress = await this.getActorAddress(sender);
    console.log(suiAddress);

    const info = await this.getActorInfo(sender);
    console.log(info);

    const mnemonic = await this.getMnemonic(sender);
    console.log(mnemonic);

    // const actorAddress = await this.getActorAddress(sender);
    // if (!actorAddress) {
    //   await this.setActorAddress(
    //     sender,
    //     '0xa217fe3fa6486b464332223a0a14418839994fa943cc1eb422ba51f99a21e56b',
    //   ); // FIXME:
    // }

    // TODO: Asset handling
    // mint `asset.address` of `asset.ammount` on Sui

    // TODO: Handle Sui raw tx
  }
}
