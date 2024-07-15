import { Raydium } from '@raydium-io/raydium-sdk-v2';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';

import { connection } from '../constants';

// FIXME: Here, the owner address is fixed because only the token contract issuer has a wrapped token (wsol, wmeme).
// Later we will need to implement this with user address management feature, mapping ethereum network to the each (sui, solana) network.
const keypair = new PublicKey('DrEe77cTWwBNdSFEvegd896TabyxSQKP9EDGbYyZcnqy');

export const useRaydium = () => {
  const [raydium, setRaydium] = useState<Raydium | null>(null);

  useEffect(() => {
    Raydium.load({
      connection,
      cluster: 'devnet',
      owner: keypair,
      disableLoadToken: true,
    }).then(setRaydium);
  }, []);

  return raydium;
};
