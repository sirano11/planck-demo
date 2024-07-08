import { useEffect, useState } from 'react';
import { erc20Abi } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';

import { TOKENS } from '@/constants/tokens';

export const useTokenBalances = () => {
  const { address, isConnected } = useAccount();

  const [tokenBalances, setTokenBalances] = useState<
    Record<`0x${string}`, bigint>
  >({});
  const result = useReadContracts({
    query: { enabled: isConnected },
    contracts: Object.values(TOKENS).map((token) => ({
      abi: erc20Abi,
      functionName: 'balanceOf',
      address: token.address,
      args: [address!],
    })),
  });

  useEffect(() => {
    if (!result.data) {
      return;
    }

    const balances = Object.values(TOKENS).reduce(
      (acc, token, index) => {
        acc[token.address] = BigInt(result.data[index]?.result || 0);
        return acc;
      },
      {} as Record<`0x${string}`, bigint>,
    );

    setTokenBalances(balances);
  }, [result.data]);

  return { tokenBalances, refresh: result.refetch };
};
