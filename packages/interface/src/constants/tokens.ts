export const CONTRACTS = {
  wBTC: '0x1ac7242ed5c58cf97cb6747347b86a5a63fb87cb',
  lMINT: '0xd43c99c2655d20ccbb6f571ee810e23e454c2336',
  cashJPY: '0x7412956391c213348695ba0af7ff96aafef481eb',
  cashKRW: '0x205e1293916138b91f831f150c814acc414bd8f5',
  cashLIVRE: '0x99671dabae4801b025a34a3ee7787da28fd2624a',
  cashSDR: '0x9edaa3ddb03cfde2d54f5e73af317742f5723844',
} as const;

export type Token = {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  coinGeckoId?: string;
  logo?: string;
};

export const TOKENS: Token[] = [
  {
    symbol: 'wBTC',
    address: CONTRACTS.wBTC,
    decimals: 8,
    logo: '/assets/bitcoin.png',
  },
  {
    symbol: 'MINT',
    address: CONTRACTS.lMINT,
    decimals: 9,
    logo: '/assets/mint.png',
  },
  {
    symbol: 'cashSDR',
    address: CONTRACTS.cashSDR,
    decimals: 9,
    logo: '/assets/cash-sdr.png',
  },
  {
    symbol: 'cashLIVRE',
    address: CONTRACTS.cashLIVRE,
    decimals: 9,
    logo: '/assets/cash-livre.png',
  },
  {
    symbol: 'cashKRW',
    address: CONTRACTS.cashKRW,
    decimals: 9,
    logo: '/assets/cash-krw.png',
  },
  {
    symbol: 'cashJPY',
    address: CONTRACTS.cashJPY,
    decimals: 9,
    logo: '/assets/cash-jpy.png',
  },
];
