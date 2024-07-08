import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import prettier from 'prettier';

import { tokens } from '../constants/tokens';

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
