import { Job, Worker } from 'bullmq';

import { QUEUE_CONFIG, QUEUE_NAME } from '@/config';

import { SuiConsumer } from './SuiConsumer';

const suiWorker = new Worker(
  QUEUE_NAME.SUI,
  async (job: Job) => {
    const consumer = SuiConsumer.getInstance();
    consumer.processTx(job.data);
  },
  {
    connection: QUEUE_CONFIG.connection,
  },
);

const solanaWorker = new Worker(
  QUEUE_NAME.SOLANA,
  async (job: Job) => {
    console.log(`solana`);
  },
  {
    connection: QUEUE_CONFIG.connection,
  },
);

//https://docs.bullmq.io/guide/going-to-production#gracefully-shut-down-workers
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, closing server...`);
  await suiWorker.close();
  await solanaWorker.close();

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

  await suiWorker.close();
  await solanaWorker.close();

  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  // Handle the error safely
  console.error({ promise, reason }, 'Unhandled Rejection at: Promise');
  await suiWorker.close();
  await solanaWorker.close();
});
