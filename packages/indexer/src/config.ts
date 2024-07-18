import { Connection } from '@solana/web3.js';
import { configDotenv } from 'dotenv';

export const connection = new Connection('https://api.devnet.solana.com', {
  commitment: 'confirmed',
});

configDotenv({ path: `.env` });

const pick = (obj: Record<string, any>, keys: string[]) => {
  const picked: Record<string, any> = {};
  for (const key of keys) {
    picked[key] = obj[key];
  }
  return picked;
};

type Config = {
  ETH_WSS_ENDPOINT: string;
  ETH_HTTP_ENDPOINT: string;
  SUI_RPC_ENDPOINT: string;
  SOLANA_RPC_ENDPOINT: string;
  START_HEIGHT: number;
  CONTRACT_ADDRESS_HUB: string;
  REDIS_URL: string;
  SOLANA_MINT_MNEMONIC: string;
  HUB_OWNER_PRIVATE_KEY: string;
  WEBSOCKET_PORT: number;
  WEBSOCKET_CORS_ORIGIN: string;
};

const getConfig = (): Config => {
  let config: any = pick(process.env, [
    'ETH_WSS_ENDPOINT',
    'ETH_HTTP_ENDPOINT',
    'SUI_RPC_ENDPOINT',
    'SOLANA_RPC_ENDPOINT',
    'START_HEIGHT',
    'CONTRACT_ADDRESS_HUB',
    'REDIS_URL',
    'SOLANA_MINT_MNEMONIC',
    'HUB_OWNER_PRIVATE_KEY',
    'WEBSOCKET_PORT',
    'WEBSOCKET_CORS_ORIGIN',
  ]);

  config.START_HEIGHT = Number.parseInt(config.START_HEIGHT || 0, 10);
  config.WEBSOCKET_PORT = Number.parseInt(config.WEBSOCKET_PORT || 3000, 10);

  return config;
};
export const Config = getConfig();

export const QUEUE_CONFIG = {
  connection: {
    host: 'localhost',
    port: 6379,
  },
  defaultJobOptions: {
    attempts: 10, // The total number of attempts to try the job until it completes.
    backoff: {
      // Backoff setting for automatic retries if the job fails
      type: 'exponential',
      delay: 3000,
    },
    removeOnFail: false, // If true, removes the job when it fails after all attempts.
    removeOnComplete: true, // If true, removes the job when it successfully completes
  },
};

const MINUTES = 60 * 1_000;
export const WORKER_CONFIG = {
  lockDuration: 2 * MINUTES,
};

export const QUEUE_NAME = {
  Sui: 'sui',
  Solana: 'solana',
  Ethereum: 'eth',
};
