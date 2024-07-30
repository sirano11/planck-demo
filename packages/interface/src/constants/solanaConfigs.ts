import { Connection, PublicKey } from '@solana/web3.js';

export const connection = new Connection('https://api.devnet.solana.com', {
  commitment: 'confirmed',
});

interface SPLTokens {
  [key: string]: PublicKey;
}

export const SPL_TOKENS: SPLTokens = {
  wSOL: new PublicKey('7tbH4ie5q6ibAVv1trsNwWQPkZcQE8wHRiBVkX9oPHP'),
  wMEME: new PublicKey('9HPW6fJsjJsCtkupv5fazmmqGo8rbKQvYkYQzvjaRuq'),
} as const;

export const POOL_IDS = {
  wSOL_wMEME_POOL_ID: 'BZvDboe83YvzaLMj546VXz7HJeNnnm18tC4u3aJZBHNV',
};
