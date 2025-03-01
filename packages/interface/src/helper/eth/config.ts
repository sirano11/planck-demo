export const HUB_CONTRACT_ADDRESS =
  '0x2912d6e766F136DfA1EbFea5C77Bb4a61fB68cF4';
export const wBTC_FAUCET_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export const TOKEN_ADDRESS = {
  wBTC: '0x7daEE33986AC827989bb32F9962d5E54080CC859',
  lMINT: '0xaCb2528D9b730129a3637Ca41fE160BB15EC26a0',
  cashJPY: '0xebDaED142b1e9b2FbB8Cd7CCbb5c095821a718A7',
  cashKRW: '0xf518ED302D4E3a4DfDde4abc6b58445B84cbfE63',
  cashLIVRE: '0x87c5625c0bc8ca05637de1bbedcC1Cfad995A21D',
  cashSDR: '0x5b53F4033C4BC5A79D758d6cF9BFea8fF08D344f',
  wSOL: '0x4cECeB128754faAB57315C12346b8f3F4E2ABEb5',
  wMEME: '0x10C7aB8a5E877d58f9d303da4E2F6f17ACB5A1Ff',
} as const;

export enum ChainIdentifier {
  Ethereum,
  Solana,
  Sui,
  TON,
}
