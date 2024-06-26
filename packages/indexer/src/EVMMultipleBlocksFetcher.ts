import { BlockPollerOptions } from '@therne/hype';
import { assignOptions } from '@therne/hype/lib/utils';
import Web3 from 'web3';

import { EVMBlock, EVMTxn } from './EVMBlock';

const RETURN_ALL_TRANSACTIONS = true;

export const withRetryAndDelay = async <T>(
  maxAttempts: number,
  delayMs: number,
  fn: () => Promise<T>,
): Promise<T | undefined> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const val = await fn();
    if (val == null) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }
    return val;
  }
  return;
};

const defaultBlockPollerOptions: BlockPollerOptions = {
  intervalInMs: 1000,
  maxRetry: 100,
};

export class EVMMultipleBlocksFetcher {
  private web3: Web3;
  public readonly options: BlockPollerOptions;

  constructor(web3: Web3, options: Partial<BlockPollerOptions> = {}) {
    this.web3 = web3;
    this.options = assignOptions(defaultBlockPollerOptions, options);
  }

  fetchBlocks = async (startBlock: number, size: number): Promise<EVMBlock[]> => {
    let blocks: EVMBlock[] = [];
    let attempts: number[] = Array.from({ length: size }, (_, index) => startBlock + index);

    while (attempts.length > 0) {
      const promises: Promise<EVMBlock | Error>[] = attempts.map(async (height) => {
        const block = await withRetryAndDelay(
          this.options.maxRetry,
          this.options.intervalInMs,
          () => this.web3.eth.getBlock(height, RETURN_ALL_TRANSACTIONS),
        );
        if (!block) {
          throw new Error(`block ${height} not available`);
        }
        return {
          height: parseInt(block.number.toString(), 10),
          timestamp: new Date(parseInt(block.timestamp.toString(), 10) * 1000),
          transactions: block.transactions as EVMTxn[],
        };
      });
      const results = await Promise.allSettled(promises);

      attempts = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && !(result.value instanceof Error)) {
          blocks.push(result.value);
        } else {
          attempts.push(startBlock + index);
        }
      });
    }

    console.log(`[+] Fetched ${blocks.length} blocks. Range:`, [
      blocks[0].height,
      blocks[blocks.length - 1].height,
    ]);
    return blocks;
  };
}
