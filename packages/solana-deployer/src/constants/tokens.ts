type TokenParameters = {
  name: string;
  symbol: string;
  initialSupply: bigint;
  decimals: number;
};

export const TOKENS: TokenParameters[] = [
  {
    name: 'Wrapped Bitcoin',
    symbol: 'wBTC',
    initialSupply: 100_000n,
    decimals: 9,
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
    initialSupply: 580_900_000n,
    decimals: 9,
  },
  {
    // Ethereum Bridged wMEME
    name: 'Wrapped MEME',
    symbol: 'wMEME',
    initialSupply: 517_510_650n,
    decimals: 9,
  },
];
