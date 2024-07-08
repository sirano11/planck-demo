import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import prettier from 'prettier';

type TokenParameters = {
  name: string;
  symbol: string;
  initialSupply: bigint;
  decimals: number;
};
const tokens: TokenParameters[] = [
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
];

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  const BridgeTokenFactory = await ethers.getContractFactory('BridgeToken');

  const deployedAddrs: string[] = [];
  for (const token of tokens) {
    // TODO: Allow user minting of wBTC (testnet faucet)
    const bridgeToken = await BridgeTokenFactory.connect(deployer).deploy(
      token.name,
      token.symbol,
      BigNumber.from(token.initialSupply).mul(
        BigNumber.from(10).pow(token.decimals),
      ),
      token.decimals,
    );
    await bridgeToken.deployed();
    console.log(`✅ ${token.symbol} deployed to:`, bridgeToken.address);
    deployedAddrs.push(bridgeToken.address);
  }

  // save addresses to json file
  const contents = await prettier.format(
    JSON.stringify(
      Object.fromEntries(
        tokens.map((token, index) => [
          token.symbol,
          deployedAddrs[index].toLowerCase(),
        ]),
      ),
    ),
    {
      parser: 'json',
      bracketSpacing: true,
      bracketSameLine: false,
      singleQuote: true,
      trailingComma: 'all',
      // semi: true,
    },
  );
  console.log(contents);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
