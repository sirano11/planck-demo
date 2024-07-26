import { Raydium } from '@raydium-io/raydium-sdk-v2';
import { Keypair, PublicKey } from '@solana/web3.js';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Address } from 'viem';

import { fromHexString } from '@/helper/solana/utils';

import { connection } from '../constants';

export const useRaydium = (address: Address | undefined) => {
  const [raydium, setRaydium] = useState<Raydium | null>(null);
  const [solActorAddress, setSolActorAddress] = useState<PublicKey | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      let actorAddress = 'DrEe77cTWwBNdSFEvegd896TabyxSQKP9EDGbYyZcnqy'; // Default Public Key
      if (!!address) {
        const { data } = await axios.get<{ actorAddress: string }>('/api/actor', {
          params: { address, chain: 'sol' },
        });
        actorAddress = data.actorAddress;
      }
      const actor = new PublicKey(actorAddress);

      const raydium = await Raydium.load({
        connection,
        cluster: 'devnet',
        owner: actor,
        disableLoadToken: true,
      });
      setRaydium(raydium);
    })();
  }, [address]);

  return raydium;
};
