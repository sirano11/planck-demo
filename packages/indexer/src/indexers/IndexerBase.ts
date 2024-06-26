export type IndexerHandler<T> = (
  events: (T & { hash: string })[],
  blockTime: Date,
) => Promise<void>;

export default interface IndexerBase<T> {
  handle: IndexerHandler<T>;
}
