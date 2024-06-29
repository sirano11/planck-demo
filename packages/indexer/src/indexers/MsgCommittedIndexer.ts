import { MsgCommittedEvent } from 'planck-demo-contracts/typechain/Hub';

import IndexerBase from './IndexerBase';

export default class MsgCommittedIndexer
  implements IndexerBase<MsgCommittedEvent>
{
  repositorySave: (height: number) => Promise<void>;

  constructor(repositorySave: (height: number) => Promise<void>) {
    this.repositorySave = repositorySave;
  }

  handle = async (events: MsgCommittedEvent[], historic: boolean) => {
    for (const event of events) {
      console.log('MsgCommittedIndexer', event);
      await this.repositorySave(event.blockNumber);
    }
  };
}
