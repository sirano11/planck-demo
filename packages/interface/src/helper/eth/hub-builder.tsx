import { waitForTransactionReceipt } from '@wagmi/core';
import { Hub__factory } from 'planck-demo-contracts/typechain/factories/Hub__factory';
import { Address, parseEther } from 'viem';
import { useWriteContract } from 'wagmi';

import { config } from '@/constants/wagmi';

export async function commit(
  contractAddress: Address,
  asset: Address,
  amount: string,
  chain: number,
  sender: Address,
  actor: string,
  data: string,
) {
  const { writeContractAsync } = useWriteContract();
  try {
    const hash = await writeContractAsync({
      address: contractAddress,
      abi: Hub__factory.abi,
      functionName: 'commit',
      args: [asset, parseEther(amount), chain, sender, actor, data],
    });

    const receipt = await waitForTransactionReceipt(config, { hash });
    return receipt;
  } catch (e) {
    console.error(e);
  }
}
