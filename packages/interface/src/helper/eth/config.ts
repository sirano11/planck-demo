export const HUB_CONTRACT_ADDRESS =
  '0x2912d6e766f136dfa1ebfea5c77bb4a61fb68cf4';

export const TOKEN_ADDRESS = {
  wBTC: '0x7daee33986ac827989bb32f9962d5e54080cc859',
  lMINT: '0xacb2528d9b730129a3637ca41fe160bb15ec26a0',
  cashJPY: '0xebdaed142b1e9b2fbb8cd7ccbb5c095821a718a7',
  cashKRW: '0xf518ed302d4e3a4dfdde4abc6b58445b84cbfe63',
  cashLIVRE: '0x87c5625c0bc8ca05637de1bbedcc1cfad995a21d',
  cashSDR: '0x5b53f4033c4bc5a79d758d6cf9bfea8ff08d344f',
  wSOL: '0x4ceceb128754faab57315c12346b8f3f4e2abeb5',
  wMEME: '0x10c7ab8a5e877d58f9d303da4e2f6f17acb5a1ff',
} as const;

export enum ChainIdentifier {
  Ethereum,
  Solana,
  Sui,
  TON,
}
