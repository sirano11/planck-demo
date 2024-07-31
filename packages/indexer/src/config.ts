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
  SOLANA_DEVNET_RPC_ENDPOINT: string;

  START_HEIGHT: number;
  REDIS_HOST: string;
  REDIS_PORT: number;

  CONTRACT_ADDRESS_HUB: string;
  ALLOWED_SENDER?: string;

  PRIVATE_KEY_SUI_CONSUMER: string;
  PRIVATE_KEY_SOLANA_CONSUMER: string;
  SOLANA_MINT_MNEMONIC: string;

  WEBSOCKET_HOST: string;
  WEBSOCKET_PORT: number;
  WEBSOCKET_CORS_ORIGIN: string;
};

const getConfig = (): Config => {
  let config: any = pick(process.env, [
    'ETH_WSS_ENDPOINT',
    'ETH_HTTP_ENDPOINT',
    'SUI_RPC_ENDPOINT',
    'SOLANA_DEVNET_RPC_ENDPOINT',
    //
    'START_HEIGHT',
    'REDIS_HOST',
    'REDIS_PORT',
    //
    'CONTRACT_ADDRESS_HUB',
    'ALLOWED_SENDER',
    //
    'PRIVATE_KEY_SUI_CONSUMER',
    'PRIVATE_KEY_SOLANA_CONSUMER',
    'SOLANA_MINT_MNEMONIC',
    //
    'WEBSOCKET_HOST',
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
    host: Config.REDIS_HOST,
    port: Config.REDIS_PORT,
  },
  defaultJobOptions: {
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
  Solana: 'sol',
  Ethereum: 'eth',
};
