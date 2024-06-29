import { Event } from 'ethers';

export type IndexerHandler<T extends Event> = (
  events: T[],
  historic: boolean,
) => Promise<void>;

export default interface IndexerBase<T extends Event> {
  handle: IndexerHandler<T>;
  repositorySave: (height: number) => void;
}
