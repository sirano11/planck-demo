import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

import { TOKENS } from '../constants/tokens';

const TOKEN_SYMBOL_TO_DEPLOY = 'wBTC';

// Deploy script to deploy a single token
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

  const BridgeTokenFactory = await ethers.getContractFactory('BridgeToken');

  const token = TOKENS.find((v) => v.symbol === TOKEN_SYMBOL_TO_DEPLOY);
  if (!token) {
    throw new Error(`Token with symbol ${TOKEN_SYMBOL_TO_DEPLOY} not found`);
  }
  const bridgeToken = await BridgeTokenFactory.connect(SUI_CONSUMER).deploy(
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

  // give access control to second admin
  await (
    await bridgeToken
      .connect(SUI_CONSUMER)
      .grantAdminRole(SOLANA_CONSUMER.address)
  ).wait();
  console.log(`✅ ${token.symbol} admin granted to:`, SOLANA_CONSUMER.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
