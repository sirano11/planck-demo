import { RedisClient } from '@/indexers/MsgCommittedIndexer';

import { BaseConsumer, ChainIdentifier, Tx } from './Consumer';

export class SuiConsumer extends BaseConsumer {
  constructor(redisClient: RedisClient) {
    super(redisClient, ChainIdentifier.Sui);
  }

  protected async processTx(tx: Tx) {
    const { asset, chain, sender, data } = tx;

    const actorAddress = await this.getActorAddress(sender);
    if (!actorAddress) {
      await this.setActorAddress(
        sender,
        '0xa217fe3fa6486b464332223a0a14418839994fa943cc1eb422ba51f99a21e56b',
      ); // FIXME:
    }

    // TODO: Asset handling
    // mint `asset.address` of `asset.ammount` on Sui

    // TODO: Handle Sui raw tx
  }
}
