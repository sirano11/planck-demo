import axios from 'axios';
import { useEffect, useState } from 'react';
import { Address } from 'viem';

import { ChainIdentifier } from '@/helper/eth/config';

type Options = {
  address?: Address;
  chain: ChainIdentifier.Sui | ChainIdentifier.Solana;
};

export const useActorAddress = (options: Options) => {
  const [actorAddress, setActorAddress] = useState<Address | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      if (!options.address) return;

      try {
        const { actorAddress } = (
          await axios.get<{ actorAddress: string }>('/api/actor', {
            params: {
              address: options.address,
              chain: options.chain,
            },
          })
        ).data;

        setHasError(false);
        setActorAddress(actorAddress as Address);
      } catch (e) {
        console.error(e);
        setHasError(true);
      }
    })();
  }, [options.address, options.chain]);

  return { hasError, actorAddress };
};
