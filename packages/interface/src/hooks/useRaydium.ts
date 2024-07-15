import { Raydium } from '@raydium-io/raydium-sdk-v2';
import * as bip39 from 'bip39';
import { useEffect, useState } from 'react';

import { getSolanaKeypair } from '@/helper/solana/keypair';

import { connection } from '../constants';

export const useRaydium = () => {
  const [raydium, setRaydium] = useState<Raydium | null>(null);

  // FIXME: Here, the owner address is fixed because only the token contract issuer has a wrapped token (wsol, wmeme).
  // Later we will need to implement this with user address management feature, mapping ethereum network to the each (sui, solana) network.

  const keypair = getSolanaKeypair(
    'defense service rail filter because must raccoon wife morning hazard produce solar',
  );

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
