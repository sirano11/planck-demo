import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import prettier from 'prettier';

import { TOKENS } from '../constants/tokens';

const deployBridgeTokens = async (admins: SignerWithAddress[]) => {
  const BridgeTokenFactory = await ethers.getContractFactory('BridgeToken');

  const deployer = admins[0];
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

    // give access control to second admin
    if (admins.length > 1) {
      await (
        await bridgeToken.connect(admins[0]).grantAdminRole(admins[1].address)
      ).wait();
      console.log(`✅ ${token.symbol} admin granted to:`, admins[1].address);
    }
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
  const [SUI_CONSUMER, SOLANA_CONSUMER] = await ethers.getSigners();
  if (!SUI_CONSUMER || !SOLANA_CONSUMER) {
    throw new Error(
      'PRIVATE_KEY_SUI_CONSUMER and PRIVATE_KEY_SOLANA_CONSUMER must be set',
    );
  }

  console.log(
    'Deploying contracts with the account:',
    SUI_CONSUMER.address.toLowerCase(),
  );

  await deployBridgeTokens([SUI_CONSUMER, SOLANA_CONSUMER]);

  const HubFactory = await ethers.getContractFactory('Hub');
  const hub = await HubFactory.connect(SUI_CONSUMER).deploy();
  console.log('✅ Deployed Hub:', hub.address.toLowerCase());

  await (
    await hub
      .connect(SUI_CONSUMER)
      .grantRole(
        ethers.utils.id('ADMIN_ROLE'),
        SOLANA_CONSUMER.address.toLowerCase(),
      )
  ).wait();
  console.log('✅ Admin granted to:', SOLANA_CONSUMER.address.toLowerCase());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
