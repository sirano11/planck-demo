import { ethers } from 'ethers';
import findWorkspaceRoot from 'find-yarn-workspace-root';
import path from 'path';
import { MsgCommittedEvent } from 'planck-demo-contracts/typechain/Hub';
import { Hub__factory } from 'planck-demo-contracts/typechain/factories/Hub__factory';
import * as redis from 'redis';

import { Config } from './config';
import MsgCommittedIndexer from './indexers/MsgCommittedIndexer';
import { saveLastSyncedHeightInJSON } from './repository';

export type IndexerDependencies = {
  repositories: {};
  prefixes: { account: string };
  network: {
    chainId: string;
    endpoint: { lcd: string; rpc: string };
  };
};

const YARN_WORKSPACE_ROOT = findWorkspaceRoot() || '';
const CACHE_FILE_PATH = path.join(
  YARN_WORKSPACE_ROOT,
  'packages',
  'indexer',
  'data',
  'cache.json',
);

const main = async (): Promise<void> => {
  console.log({ ...Config, CACHE_FILE_PATH });

  const provider = new ethers.providers.JsonRpcProvider(
    Config.ETH_RPC_ENDPOINT,
  );
  const hubContract = Hub__factory.connect(
    Config.CONTRACT_ADDRESS_HUB,
    provider,
  );

  const msgCommittedFilter = hubContract.filters.MsgCommitted();

  const startHeight = Config.START_HEIGHT;

  const repository = saveLastSyncedHeightInJSON(startHeight, CACHE_FILE_PATH);

  const redisClient = redis.createClient({
    url: Config.REDIS_URL,
  });

  const msgCommittedIndexer = new MsgCommittedIndexer(
    redisClient,
    repository.save,
  );

  let historicEventsProcessed = false;
  let pendingEvents: MsgCommittedEvent[] = [];
  let latestEventBlockNumber: number | null = null;

  hubContract.on(msgCommittedFilter, async (_0, _1, _2, _3, _4, _5, event) => {
    if (historicEventsProcessed) {
      if (pendingEvents.length > 0) {
        await msgCommittedIndexer.handle(pendingEvents, true);
        pendingEvents = [];
      }
      await msgCommittedIndexer.handle([event], true);

      if (latestEventBlockNumber !== event.blockNumber) {
        console.log(`[*] Processing block ${event.blockNumber}`);
        latestEventBlockNumber = event.blockNumber;
      }
    } else {
      pendingEvents.push(event);
    }
  });

  const latestBlock = await provider.getBlockNumber();
  const batchSize = 1000;

  for (let i = startHeight; i <= latestBlock; i += batchSize) {
    const fromBlock = i;
    const toBlock = Math.min(i + batchSize - 1, latestBlock);
    console.log(`[*] Fetching events from block ${fromBlock} to ${toBlock}`);
    const events = await hubContract.queryFilter(
      msgCommittedFilter,
      fromBlock,
      toBlock,
    );
    await msgCommittedIndexer.handle(events, true);
  }

  historicEventsProcessed = true;
};

main()
  .then(() => console.log('✨ Done'))
  .catch(console.error);
