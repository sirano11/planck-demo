import { Queue, QueueEvents } from 'bullmq';
import { ethers } from 'ethers';
import findWorkspaceRoot from 'find-yarn-workspace-root';
import path from 'path';
import { Hub__factory } from 'planck-demo-contracts/typechain/factories/Hub__factory';

import { Config, QUEUE_CONFIG, QUEUE_NAME } from './config';
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const suiQueue = new Queue(QUEUE_NAME.Sui, {
  connection: QUEUE_CONFIG.connection,
  defaultJobOptions: QUEUE_CONFIG.defaultJobOptions,
});

const suiQueueEvents = new QueueEvents(QUEUE_NAME.Sui, {
  connection: QUEUE_CONFIG.connection,
});

const solanaQueue = new Queue(QUEUE_NAME.Solana, {
  connection: QUEUE_CONFIG.connection,
  defaultJobOptions: QUEUE_CONFIG.defaultJobOptions,
});

const solanaQueueEvents = new QueueEvents(QUEUE_NAME.Solana, {
  connection: QUEUE_CONFIG.connection,
});

const provider = new ethers.providers.JsonRpcProvider(Config.ETH_HTTP_ENDPOINT);
const hubContract = Hub__factory.connect(Config.CONTRACT_ADDRESS_HUB, provider);

const main = async (): Promise<void> => {
  console.log({ ...Config, CACHE_FILE_PATH });

  const msgCommittedFilter = hubContract.filters.MsgCommitted(
    null,
    null,
    null,
    Config.ALLOWED_SENDER || null,
    null,
  );

  const repository = saveLastSyncedHeightInJSON(
    Config.START_HEIGHT,
    CACHE_FILE_PATH,
  );
  const startHeight = await repository.load();

  const msgCommittedIndexer = new MsgCommittedIndexer(
    repository.save,
    suiQueue,
    solanaQueue,
  );

  let latestBlock = await provider.getBlockNumber();
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
    await msgCommittedIndexer.handle(events);
  }

  await repository.save(latestBlock);

  let currentBlock = latestBlock + 1; // already fetched latest block
  latestBlock = await provider.getBlockNumber();
  while (true) {
    if (currentBlock > latestBlock) {
      latestBlock = await provider.getBlockNumber();

      // Avoid to limit RPC request rate.
      // Also avoid to block node js event-loop.
      // Sepolia networks generates block each 12 sec.
      await sleep(5000);
      continue;
    }
    console.log(`fetching block ${currentBlock}`);
    const events = await hubContract.queryFilter(
      msgCommittedFilter,
      currentBlock,
      currentBlock,
    );

    await msgCommittedIndexer.handle(events);
    currentBlock = currentBlock + 1;
  }
};

//---> Queue Event handler
suiQueueEvents.on('completed', ({ jobId, returnvalue }) => {
  // Called every time a job is completed in any worker.
  const date = new Date().toISOString();
  console.log(`Completed Sui tx job ${jobId} time ${date}`);
});

solanaQueueEvents.on('completed', ({ jobId, returnvalue }) => {
  // Called every time a job is completed in any worker.
  const date = new Date().toISOString();
  console.log(`Completed Solana tx job ${jobId} time ${date}`);
});

//<--- Queue Event handler

//---> Error handler
//https://docs.bullmq.io/guide/going-to-production#gracefully-shut-down-workers
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, closing server...`);
  await suiQueue.close();
  await suiQueueEvents.close();
  await solanaQueue.close();
  await solanaQueueEvents.close();

  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// https://docs.bullmq.io/guide/going-to-production#unhandled-exceptions-and-rejections
// https://nodejs.org/docs/latest-v16.x/api/process.html#warning-using-uncaughtexception-correctly
// The correct use of 'uncaughtException' is to perform synchronous cleanup of allocated resources (e.g. file descriptors, handles, etc) before shutting down the process. It is not safe to resume normal operation after 'uncaughtException'.
process.on('uncaughtException', async (err, origin) => {
  // The 'beforeExit' event is not emitted for conditions causing explicit termination,
  // such as calling process.exit() or uncaught exceptions.
  console.error({ err, origin }, 'uncaught exception occurred.');

  await suiQueue.close();
  await suiQueueEvents.close();
  await solanaQueue.close();
  await solanaQueueEvents.close();

  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  // Handle the error safely
  console.error({ promise, reason }, 'Unhandled Rejection at: Promise');
  await suiQueue.close();
  await suiQueueEvents.close();
  await solanaQueue.close();
  await solanaQueueEvents.close();

  process.exit(1);
});
//<--- Error handler

main()
  .then(() => console.log('✨ Done'))
  .catch((e) => {
    /**
     *  If it is necessary to terminate the Node.js process due to an error condition,
        throwing an _uncaught_ error and allowing the process to terminate accordingly
        is safer than calling `process.exit()`.
     */
    console.log(e);
    throw e;
  });
