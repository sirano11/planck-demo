import { Connection, PublicKey } from '@solana/web3.js';

export const connection = new Connection('https://api.devnet.solana.com', {
  commitment: 'confirmed',
});

export const SPL_TOKENS = {
  wSOL: new PublicKey('5L9yR1bF4gdzZBfGxxLkidgUmjFa7CGBppKZPBYaPL3F'),
  wMEME: new PublicKey('iAo1RFXsYotAEf3vVj4tmxAPGrX8QmZnbFxumqRZ7xb'),
} as const;

export const POOL_IDS = {
  SOL_WSOL_POOL_ID: '4f37zAc4uX66hCkz76YgLp6nC7kA5PnBZASx5YQB8vqP',
  wSOL_wMEME_POOL_ID: 'mPtRHZZbCmwvcJRn8W7sEHN4X7yX7FAC56NL6CWWWqM',
};
