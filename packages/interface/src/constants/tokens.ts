import { PROTOCOL } from '@/helper/sui/config';

import { CONTRACTS } from './contracts';

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
