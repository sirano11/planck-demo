import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import prettier from 'prettier';

import { TOKENS } from '../constants/tokens';

const deployBridgeTokens = async (deployer: SignerWithAddress) => {
  const BridgeTokenFactory = await ethers.getContractFactory('BridgeToken');

  const deployedAddrs: string[] = [];
  for (const token of TOKENS) {
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

    const bridgeTokenAddress = bridgeToken.address.toLowerCase();
    console.log(`✅ ${token.symbol} deployed to:`, bridgeTokenAddress);
    deployedAddrs.push(bridgeTokenAddress);
  }

  // save addresses to json file
  const contents = await prettier.format(
    JSON.stringify(
      Object.fromEntries(
        TOKENS.map((token, index) => [token.symbol, deployedAddrs[index]]),
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
};

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    'Deploying contracts with the account:',
    deployer.address.toLowerCase(),
  );

  await deployBridgeTokens(deployer);

  const HubFactory = await ethers.getContractFactory('Hub');
  const hub = await HubFactory.connect(deployer).deploy();

  console.log('✅ Deployed Hub:', hub.address.toLowerCase());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
