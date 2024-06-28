import { waitForTransactionReceipt } from '@wagmi/core';
import { IERC20__factory } from 'planck-demo-contracts/typechain/factories/IERC20__factory';
import { Address, parseEther } from 'viem';
import { useWriteContract } from 'wagmi';

import { config } from '@/constants/wagmi';

export async function approve(
  contractAddress: Address,
  spender: Address,
  amount: string,
) {
  const { writeContractAsync } = useWriteContract();
  try {
    const hash = await writeContractAsync({
      address: contractAddress,
      abi: IERC20__factory.abi,
      functionName: 'approve',
      args: [spender, parseEther(amount)],
    });

    const receipt = await waitForTransactionReceipt(config, { hash });
    return receipt;
  } catch (e) {
    console.error(e);
  }
}

export async function transferFrom(
  contractAddress: Address,
  sender: Address,
  recipient: Address,
  amount: string,
) {
  const { writeContractAsync } = useWriteContract();
  try {
    const hash = await writeContractAsync({
      address: contractAddress,
      abi: IERC20__factory.abi,
      functionName: 'approve',
      args: [sender, recipient, parseEther(amount)],
    });

    const receipt = await waitForTransactionReceipt(config, { hash });
    return receipt;
  } catch (e) {
    console.error(e);
  }
}
