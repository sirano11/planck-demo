import { Raydium } from '@raydium-io/raydium-sdk-v2';
import { PublicKey } from '@solana/web3.js';
import axios, { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Address } from 'viem';

import { connection } from '../constants';

export const useRaydium = (address: Address | undefined) => {
  const [raydium, setRaydium] = useState<Raydium | null>(null);

  useEffect(() => {
    (async () => {
      let actorAddress = 'DrEe77cTWwBNdSFEvegd896TabyxSQKP9EDGbYyZcnqy'; // Default Public Key
      if (!!address) {
        try {
          const { data } = await axios.get<{ actorAddress: string }>(
            '/api/actor',
            { params: { address, chain: 'sol' } },
          );
          actorAddress = data.actorAddress;
        } catch (err) {
          console.error(err);
          if (err instanceof AxiosError && err.response?.status === 404) {
            toast.error('Actor wallet not registered');
          } else {
            toast.error('Failed to fetch actor wallet');
          }
        }
      }

      try {
        const actor = new PublicKey(actorAddress);

        const raydium = await Raydium.load({
          connection,
          cluster: 'devnet',
          owner: actor,
          disableLoadToken: true,
        });
        setRaydium(raydium);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load Raydium');
      }
    })();
  }, [address]);

  return raydium;
};
