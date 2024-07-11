import { Address } from 'viem';

import { ChainIdentifier, TOKEN_ADDRESS } from '@/helper/eth/config';
import { PROTOCOL } from '@/helper/sui/config';

import { CONTRACTS } from './contracts';

export type TokenCategory = 'wbtc' | 'lmint' | 'cash' | 'wsol' | 'wmeme';

export type Token = {
  symbol: string;
  category: TokenCategory;
  address: Address;
  decimals: number;
  coinGeckoId?: string;
  logo?: string;
  typeArgument?: string;
  supplyId?: string;
  chain: ChainIdentifier;
};

export const TOKENS: Token[] = [
  {
    symbol: 'wBTC',
    category: 'wbtc',
    address: TOKEN_ADDRESS.wBTC,
    decimals: 8,
    logo: '/assets/bitcoin.png',
    chain: ChainIdentifier.Sui,
  },
  {
    symbol: 'MINT',
    category: 'lmint',
    address: TOKEN_ADDRESS.lMINT,
    decimals: 9,
    logo: '/assets/mint.png',
    typeArgument: PROTOCOL.TYPE_ARGUMENT.LIQUID_MINT,
    supplyId: PROTOCOL.OBJECT_ID.SUPPLY_LIQUID_MINT,
    chain: ChainIdentifier.Sui,
  },
  {
    symbol: 'cashSDR',
    category: 'cash',
    address: TOKEN_ADDRESS.cashSDR,
    decimals: 9,
    logo: '/assets/cash-sdr.png',
    typeArgument: PROTOCOL.TYPE_ARGUMENT.CASH_SDR,
    supplyId: PROTOCOL.OBJECT_ID.SUPPLY_SDR,
    chain: ChainIdentifier.Sui,
  },
  {
    symbol: 'cashLIVRE',
    category: 'cash',
    address: TOKEN_ADDRESS.cashLIVRE,
    decimals: 9,
    logo: '/assets/cash-livre.png',
    typeArgument: PROTOCOL.TYPE_ARGUMENT.CASH_LIVRE,
    supplyId: PROTOCOL.OBJECT_ID.SUPPLY_LIVRE,
    chain: ChainIdentifier.Sui,
  },
  {
    symbol: 'cashKRW',
    category: 'cash',
    address: TOKEN_ADDRESS.cashKRW,
    decimals: 9,
    logo: '/assets/cash-krw.png',
    typeArgument: PROTOCOL.TYPE_ARGUMENT.CASH_KRW,
    supplyId: PROTOCOL.OBJECT_ID.SUPPLY_KRW,
    chain: ChainIdentifier.Sui,
  },
  {
    symbol: 'cashJPY',
    category: 'cash',
    address: TOKEN_ADDRESS.cashJPY,
    decimals: 9,
    logo: '/assets/cash-jpy.png',
    typeArgument: PROTOCOL.TYPE_ARGUMENT.CASH_JPY,
    supplyId: PROTOCOL.OBJECT_ID.SUPPLY_JPY,
    chain: ChainIdentifier.Sui,
  },
  {
    symbol: 'wSOL',
    category: 'wsol',
    address: CONTRACTS.wSOL,
    decimals: 9,
    chain: ChainIdentifier.Solana,
  },
  {
    symbol: 'wMEME',
    category: 'wmeme',
    address: CONTRACTS.wMEME,
    decimals: 9,
    chain: ChainIdentifier.Solana,
  },
];
