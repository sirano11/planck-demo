type TokenParameters = {
  name: string;
  symbol: string;
  initialSupply: bigint;
  decimals: number;
};
export const tokens: TokenParameters[] = [
  {
    name: 'Wrapped Bitcoin',
    symbol: 'wBTC',
    initialSupply: 21_000_000n,
    decimals: 8,
  },
  {
    // Ethereum Bridged lMINT
    name: 'Liquid Mint',
    symbol: 'lMINT',
    initialSupply: 100_000_000n,
    decimals: 9,
  },
  {
    // Ethereum Bridged CashJPY
    name: 'CashJPY',
    symbol: 'cashJPY',
    initialSupply: 100_000_000n,
    decimals: 9,
  },
  {
    // Ethereum Bridged CashKRW
    name: 'CashKRW',
    symbol: 'cashKRW',
    initialSupply: 100_000_000n,
    decimals: 9,
  },
  {
    // Ethereum Bridged CashLIVRE
    name: 'CashLIVRE',
    symbol: 'cashLIVRE',
    initialSupply: 100_000_000n,
    decimals: 9,
  },
  {
    // Ethereum Bridged CashSDR
    name: 'CashSDR',
    symbol: 'cashSDR',
    initialSupply: 100_000_000n,
    decimals: 9,
  },
  {
    // Ethereum Bridged wSOL
    name: 'Wrapped SOL',
    symbol: 'wSOL',
    initialSupply: 1_230_000n,
    decimals: 9,
  },
  {
    // Ethereum Bridged wMEME
    name: 'Wrapped MEME',
    symbol: 'wMEME',
    initialSupply: 1_230_000n,
    decimals: 9,
  },
];
