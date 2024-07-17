import { waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { Hub__factory } from 'planck-demo-contracts/typechain/factories/Hub__factory';
import { Address } from 'viem';

import { config } from '../../constants/wagmi';

export const encodeRawTx = (data: Uint8Array) =>
  `0x${data.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')}`;

export const commit = (
  contractAddress: Address,
  asset: Address,
  amountAtomics: bigint,
  chain: number,
  data: Uint8Array,
) =>
  writeContract(config, {
    address: contractAddress,
    abi: Hub__factory.abi,
    functionName: 'commit',
    args: [asset, amountAtomics, chain, encodeRawTx(data)],
  });
