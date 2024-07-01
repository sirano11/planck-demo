import { MsgCommittedEvent } from 'planck-demo-contracts/typechain/Hub';
import * as redis from 'redis';

import { ChainIdentifier, Tx } from '@/consumers/Consumer';
import { SolanaConsumer } from '@/consumers/SolanaConsumer';
import { SuiConsumer } from '@/consumers/SuiConsumer';

import IndexerBase from './IndexerBase';

export type RedisClient = ReturnType<typeof redis.createClient>;

export default class MsgCommittedIndexer
  implements IndexerBase<MsgCommittedEvent>
{
  repositorySave: (height: number) => Promise<void>;
  private solanaConsumer: SolanaConsumer;
  private suiConsumer: SuiConsumer;

  constructor(
    redisClient: RedisClient,
    repositorySave: (height: number) => Promise<void>,
  ) {
    this.repositorySave = repositorySave;
    this.solanaConsumer = new SolanaConsumer(redisClient);
    this.suiConsumer = new SuiConsumer(redisClient);
  }

  handle = async (events: MsgCommittedEvent[], historic: boolean) => {
    for (const event of events) {
      const { asset, amount, chain, sender, actor, data } = event.args;

      const tx: Tx = {
        asset: { address: asset, amount },
        chain,
        sender: sender,
        data: data,
      };

      if (chain === ChainIdentifier.Solana) {
        this.solanaConsumer.enqueue(tx);
      } else if (chain === ChainIdentifier.Sui) {
        this.suiConsumer.enqueue(tx);
      } else {
        // TODO: Handle other chains
      }

      await this.repositorySave(event.blockNumber);
    }
  };
}
