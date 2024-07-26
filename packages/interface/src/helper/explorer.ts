import { Address, Hash } from 'viem';

const ETH_EXPLORER_BASE_URL = 'https://sepolia.etherscan.io';
const SOL_EXPLORER_BASE_URL = 'https://explorer.solana.com';
const SUI_EXPLORER_BASE_URL = 'https://suiscan.xyz/testnet';

export const EthereumExplorer = {
  getTxLink: (hash: Hash) => `${ETH_EXPLORER_BASE_URL}/tx/${hash}`,
  getAccountLink: (address?: Address) =>
    `${ETH_EXPLORER_BASE_URL}/address/${address}`,
};

export const SolanaExplorer = {
  getTxLink: (signature: string) =>
    `${SOL_EXPLORER_BASE_URL}/tx/${signature}?cluster=testnet`,
  getAccountLink: (address?: string) =>
    `${SOL_EXPLORER_BASE_URL}/address/${address}?cluster=testnet`,
};

export const SuiExplorer = {
  getTxLink: (digest: string) => `${SUI_EXPLORER_BASE_URL}/tx/${digest}`,
  getAccountLink: (address?: Address) =>
    `${SUI_EXPLORER_BASE_URL}/address/${address}`,
};
