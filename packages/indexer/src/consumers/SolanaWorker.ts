import { Job, Worker } from 'bullmq';
import { io } from 'socket.io-client';

import { Config, QUEUE_CONFIG, QUEUE_NAME, WORKER_CONFIG } from '@/config';

import { ChainIdentifier } from './Consumer';
import { SolanaConsumer } from './SolanaConsumer';

const socket = io(`http://localhost:${Config.WEBSOCKET_PORT}`, {
  autoConnect: true,
});

const solanaWorker = new Worker(
  QUEUE_NAME.Solana,
  async (job: Job) => {
    const consumer = SolanaConsumer.getInstance();
    await consumer.processTx(job);
  },
  {
    connection: QUEUE_CONFIG.connection,
    lockDuration: WORKER_CONFIG.lockDuration,
  },
);

solanaWorker.on('progress', (job: Job, progress: number | object) => {
  console.log({ id: job.id, progress }, 'Job progress');
  if (typeof progress === 'object' && job.id) {
    socket.emit('job-status', {
      ...progress,
      id: job.id,
      chain: ChainIdentifier.Solana,
      error: false,
    });
  }
});

solanaWorker.on('completed', (job: Job) => {
  console.log({ id: job.id }, 'Job completed');
  if (job.id) {
    socket.emit('job-status', {
      id: job.id,
      chain: ChainIdentifier.Solana,
      status: 'completed',
      error: false,
    });
  }
});

solanaWorker.on('failed', (job: Job | undefined, error: Error) => {
  console.log(error);
  console.log({ id: job?.id }, 'Job failed');
  if (job && job.id && error.message) {
    socket.emit('job-status', {
      id: job.id,
      chain: ChainIdentifier.Solana,
      status: error.message,
      error: true,
    });
  }
});

//https://docs.bullmq.io/guide/going-to-production#gracefully-shut-down-workers
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, closing server...`);
  const solanaConsumer = SolanaConsumer.getInstance();

  await solanaConsumer.disconnectRedis();
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
  const solanaConsumer = SolanaConsumer.getInstance();
  await solanaConsumer.disconnectRedis();
  await solanaWorker.close();

  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  // Handle the error safely
  console.error({ promise, reason }, 'Unhandled Rejection at: Promise');
  const solanaConsumer = SolanaConsumer.getInstance();
  await solanaConsumer.disconnectRedis();
  await solanaWorker.close();
});
