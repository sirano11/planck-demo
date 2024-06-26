import IndexerBase from './IndexerBase';

export interface MsgCommittedEvent {
  asset: string;
  amount: string;
  chain: string;
  sender: string;
  actor: string;
  data: string;
}

export default class MsgCommittedIndexer
  implements IndexerBase<MsgCommittedEvent>
{
  handle = async (events: MsgCommittedEvent[], blockTime: Date) => {
    // TODO: Implement this
  };
}
