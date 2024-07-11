export const HUB_CONTRACT_ADDRESS =
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

export const TOKEN_ADDRESS = {
  wBTC: '0x5fbdb2315678afecb367f032d93f642f64180aa3',
  lMINT: '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512',
  cashJPY: '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0',
  cashKRW: '0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9',
  cashLIVRE: '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9',
  cashSDR: '0x5fc8d32690cc91d4c39d9d3abcbd16989f875707',
  wSOL: '0x0165878a594ca255338adfa4d48449f69242eb8f',
  wMEME: '0xa513e6e4b8f2a923d98304ec87f64353c4d5c853',
} as const;

export enum ChainIdentifier {
  Ethereum,
  Solana,
  Sui,
  TON,
}
