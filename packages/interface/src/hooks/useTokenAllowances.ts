import { useEffect, useState } from 'react';
import { erc20Abi } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';

import { TOKENS } from '@/constants/tokens';
import { HUB_CONTRACT_ADDRESS } from '@/helper/eth/config';

export const useTokenAllowances = () => {
  const { address, isConnected } = useAccount();

  const [tokenAllowances, setTokenAllowances] = useState<
    Record<`0x${string}`, bigint>
  >({});

  const result = useReadContracts({
    query: { enabled: isConnected },
    contracts: TOKENS.map((token) => ({
      abi: erc20Abi,
      functionName: 'allowance',
      address: token.address,
      args: [address!, HUB_CONTRACT_ADDRESS],
    })),
  });

  useEffect(() => {
    if (!result.data) {
      return;
    }

    const allowances = TOKENS.reduce(
      (acc, token, index) => {
        acc[token.address] = BigInt(result.data[index]?.result || 0);
        return acc;
      },
      {} as Record<`0x${string}`, bigint>,
    );

    setTokenAllowances(allowances);
  }, [result.data]);

  return { tokenAllowances, refresh: result.refetch };
};
