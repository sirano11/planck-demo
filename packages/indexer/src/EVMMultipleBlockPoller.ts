import { LastSyncedHeightRepository } from '@therne/hype';
import { log } from '@therne/hype/lib/logger';
import { assignOptions } from '@therne/hype/lib/utils';

import { EVMBlock } from './EVMBlock';
import { EVMMultipleBlocksFetcher } from './EVMMultipleBlocksFetcher';

export interface EVMBlockDataSource {
  blocks(): AsyncGenerator<EVMBlock>;
}

type EVMBlockPollerOptions = {
  prefetchThreshold: number;
  batchSize: number;
};
const defaultBlockPollerOptions: EVMBlockPollerOptions = {
  prefetchThreshold: 0,
  batchSize: 1,
};

export class EVMMultipleBlockPoller implements EVMBlockDataSource {
  public readonly options: EVMBlockPollerOptions;

  constructor(
    public blockFetcher: EVMMultipleBlocksFetcher,
    public lastSyncedHeightRepository: LastSyncedHeightRepository,
    options: Partial<EVMBlockPollerOptions> = {},
  ) {
    this.options = assignOptions(defaultBlockPollerOptions, options);
  }

  private nextBlocks: EVMBlock[] = [];

  async prefetchBlocks() {
    const lastSyncedHeight = await this.lastSyncedHeightRepository.load();
    const blocks = await this.blockFetcher.fetchBlocks(
      lastSyncedHeight + 1,
      this.options.batchSize,
    );
    this.nextBlocks.push(...blocks);
  }

  async *blocks(): AsyncGenerator<EVMBlock> {
    while (true) {
      if (
        this.nextBlocks.length === 0 ||
        this.nextBlocks.length < this.options.prefetchThreshold
      ) {
        await this.prefetchBlocks();
      }

      // No more blocks to yield.
      if (this.nextBlocks.length === 0) break;

      const block = this.nextBlocks.shift();
      if (!block) break;

      log('trace', 'block-poller', 'polled block', {
        height: block.height,
        timestamp: block.timestamp,
        syncLagMs: Date.now() - +block.timestamp,
      });
      yield block;

      await this.lastSyncedHeightRepository.save(block.height);
    }
  }
}
