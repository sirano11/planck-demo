import { Queue } from 'bullmq';
import { BigNumber } from 'ethers';
import { MsgCommittedEvent } from 'planck-demo-contracts/typechain/Hub';
import * as redis from 'redis';

import { QUEUE_CONFIG, QUEUE_NAME } from '@/config';
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
      const { asset, amount, chain, sender, actor, data } = event.args;

      const tx: Tx = {
        asset: { address: asset, amount },
        chain,
        sender: sender,
        data: data,
      };

      if (chain === ChainIdentifier.Solana) {
        this.solanaQueue.add(
          QUEUE_NAME.SOLANA,
          { tx },
          { jobId: event.transactionHash },
        );
      } else if (chain === ChainIdentifier.Sui) {
        this.suiQueue.add(
          QUEUE_NAME.SUI,
          { tx },
          { jobId: event.transactionHash },
        );
      } else {
        // TODO: Handle other chains
      }

      await this.repositorySave(event.blockNumber);
    }
  };

  mockHandle = async (tx: Tx, transactionHash: string) => {
    if (tx.chain === ChainIdentifier.Solana) {
      this.solanaQueue.add(
        QUEUE_NAME.SOLANA,
        { tx },
        { jobId: transactionHash },
      );
    } else if (tx.chain === ChainIdentifier.Sui) {
      this.suiQueue.add(QUEUE_NAME.SUI, { tx }, { jobId: transactionHash });
    } else {
      // TODO: Handle other chains
    }
  };
}
