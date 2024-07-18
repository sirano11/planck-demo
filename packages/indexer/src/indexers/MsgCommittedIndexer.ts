import { Queue } from 'bullmq';
import { MsgCommittedEvent } from 'planck-demo-contracts/typechain/Hub';

import { QUEUE_NAME } from '@/config';
import { ChainIdentifier, Tx } from '@/consumers/Consumer';

import IndexerBase from './IndexerBase';

export default class MsgCommittedIndexer
  implements IndexerBase<MsgCommittedEvent>
{
  repositorySave: (height: number) => Promise<void>;
  suiQueue: Queue;
  solanaQueue: Queue;

  constructor(
    repositorySave: (height: number) => Promise<void>,
    suiQueue: Queue,
    solanaQueue: Queue,
  ) {
    this.repositorySave = repositorySave;
    this.suiQueue = suiQueue;
    this.solanaQueue = solanaQueue;
  }

  handle = async (events: MsgCommittedEvent[], historic: boolean) => {
    for (const event of events) {
      const { asset, amount, chain, sender, data } = event.args;

      const tx: Tx = {
        asset: { address: asset, amount: amount.toString() },
        chain,
        sender: sender,
        data: data,
      };

      if (chain === ChainIdentifier.Solana) {
        await this.solanaQueue.add(QUEUE_NAME.Solana, tx, {
          jobId: event.transactionHash,
        });
      } else if (chain === ChainIdentifier.Sui) {
        await this.suiQueue.add(QUEUE_NAME.Sui, tx, {
          jobId: event.transactionHash,
        });
      } else {
        // TODO: Handle other chains
      }

      await this.repositorySave(event.blockNumber);
    }
  };

  mockHandle = async (tx: Tx, transactionHash: string) => {
    if (tx.chain === ChainIdentifier.Solana) {
      await this.solanaQueue.add(QUEUE_NAME.Solana, tx, {
        jobId: transactionHash,
      });
    } else if (tx.chain === ChainIdentifier.Sui) {
      await this.suiQueue.add(QUEUE_NAME.Sui, tx, {
        jobId: transactionHash,
      });
    } else {
      // TODO: Handle other chains
    }
  };
}
