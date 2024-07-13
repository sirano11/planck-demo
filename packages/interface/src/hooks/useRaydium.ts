import { Raydium } from '@raydium-io/raydium-sdk-v2';
import { useEffect, useState } from 'react';

import { connection } from '../constants';

export const useRaydium = () => {
  const [raydium, setRaydium] = useState<Raydium | null>(null);

  useEffect(() => {
    Raydium.load({
      connection,
      cluster: 'devnet',
      disableLoadToken: true,
    }).then(setRaydium);
  }, []);

  return raydium;
};
