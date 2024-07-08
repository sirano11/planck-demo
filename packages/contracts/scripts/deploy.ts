import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

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

  const BridgeToken = await ethers.getContractFactory('BridgeToken');

  for (const token of tokens) {
    const tokenContract = await BridgeToken.connect(deployer).deploy(
      token.name,
      token.symbol,
      BigNumber.from(token.initialSupply).mul(
        BigNumber.from(10).pow(token.decimals),
      ),
      token.decimals,
    );
    await tokenContract.deployed();
    console.log(`✅ ${token.symbol} deployed to:`, tokenContract.address);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
