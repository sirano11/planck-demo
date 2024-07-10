import { PROTOCOL } from '@/helper/sui/config';

export const CONTRACTS = {
  wBTC: '0x1ac7242ed5c58cf97cb6747347b86a5a63fb87cb',
  lMINT: '0xd43c99c2655d20ccbb6f571ee810e23e454c2336',
  cashJPY: '0x7412956391c213348695ba0af7ff96aafef481eb',
  cashKRW: '0x205e1293916138b91f831f150c814acc414bd8f5',
  cashLIVRE: '0x99671dabae4801b025a34a3ee7787da28fd2624a',
  cashSDR: '0x9edaa3ddb03cfde2d54f5e73af317742f5723844',
  wSOL: '0xD308f37Ec20a11D2f979274afe06802595BBBEab',
  wMEME: '0xFf47d172CEa82096b8B82e916697beB306C4C685',
} as const;

export type TokenCategory = 'wbtc' | 'lmint' | 'cash' | 'wsol' | 'wmeme';

export type Token = {
  symbol: string;
  category: TokenCategory;
  address: `0x${string}`;
  decimals: number;
  coinGeckoId?: string;
  logo?: string;
  typeArgument?: string;
};

export const TOKENS: Token[] = [
  {
    symbol: 'wBTC',
    category: 'wbtc',
    address: CONTRACTS.wBTC,
    decimals: 8,
    logo: '/assets/bitcoin.png',
  },
  {
    symbol: 'MINT',
    category: 'lmint',
    address: CONTRACTS.lMINT,
    decimals: 9,
    logo: '/assets/mint.png',
    typeArgument: PROTOCOL.TYPE_ARGUMENT.LIQUID_MINT,
  },
  {
    symbol: 'cashSDR',
    category: 'cash',
    address: CONTRACTS.cashSDR,
    decimals: 9,
    logo: '/assets/cash-sdr.png',
    typeArgument: PROTOCOL.TYPE_ARGUMENT.CASH_SDR,
  },
  {
    symbol: 'cashLIVRE',
    category: 'cash',
    address: CONTRACTS.cashLIVRE,
    decimals: 9,
    logo: '/assets/cash-livre.png',
    typeArgument: PROTOCOL.TYPE_ARGUMENT.CASH_LIVRE,
  },
  {
    symbol: 'cashKRW',
    category: 'cash',
    address: CONTRACTS.cashKRW,
    decimals: 9,
    logo: '/assets/cash-krw.png',
    typeArgument: PROTOCOL.TYPE_ARGUMENT.CASH_KRW,
  },
  {
    symbol: 'cashJPY',
    category: 'cash',
    address: CONTRACTS.cashJPY,
    decimals: 9,
    logo: '/assets/cash-jpy.png',
    typeArgument: PROTOCOL.TYPE_ARGUMENT.CASH_JPY,
  },
  {
    symbol: 'wSOL',
    category: 'wsol',
    address: CONTRACTS.wSOL,
    decimals: 9,
  },
  {
    symbol: 'wMEME',
    category: 'wmeme',
    address: CONTRACTS.wMEME,
    decimals: 9,
  },
];
