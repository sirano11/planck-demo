import { configDotenv } from 'dotenv';

configDotenv({ path: `.env` });

const pick = (obj: Record<string, any>, keys: string[]) => {
  const picked: Record<string, any> = {};
  for (const key of keys) {
    picked[key] = obj[key];
  }
  return picked;
};

type Config = {
  RPC_ENDPOINT: string;
  START_HEIGHT: number;
  CONTRACT_ADDRESS_HUB: string;
};

const getConfig = (): Config => {
  let config: any = pick(process.env, [
    'RPC_ENDPOINT',
    'START_HEIGHT',
    'CONTRACT_ADDRESS_HUB',
  ]);

  config.START_HEIGHT = Number.parseInt(config.START_HEIGHT || 0, 10);

  return config;
};
export const Config = getConfig();
