import { Address, Hash } from 'viem';

const EXPLORER_BASE_URL = 'https://sepolia.etherscan.io';

export const Explorer = {
  getTxLink: (hash: Hash) => `${EXPLORER_BASE_URL}/tx/${hash}`,
  getAccountLink: (address?: Address) =>
    `${EXPLORER_BASE_URL}/address/${address}`,
};
