import { waitForTransactionReceipt } from '@wagmi/core';
import { writeContract } from '@wagmi/core';
import { Hub__factory } from 'planck-demo-contracts/typechain/factories/Hub__factory';
import { Address } from 'viem';

import { config } from '@/constants/wagmi';

export async function commit(
  contractAddress: Address,
  asset: Address,
  amountAtomics: bigint,
  chain: number,
  data: Uint8Array,
) {
  try {
    const hash = await writeContract(config, {
      address: contractAddress,
      abi: Hub__factory.abi,
      functionName: 'commit',
      args: [
        asset,
        amountAtomics,
        chain,
        `0x${data.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')}`,
      ],
    });

    const receipt = await waitForTransactionReceipt(config, { hash });
    return receipt;
  } catch (e) {
    console.error(e);
  }
}
