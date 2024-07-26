import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import 'hardhat-contract-sizer';
import 'hardhat-gas-reporter';
import { HardhatUserConfig, task } from 'hardhat/config';
import {
  HUB_CONTRACT_ADDRESS,
  TOKEN_ADDRESS,
} from 'planck-demo-interface/src/helper/eth/config';
import 'solidity-coverage';

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task(
  'checksum',
  'Convert the non-mixedcase address to mixed one (Checksum Address)',
)
  .addParam('address', 'Address to be converted')
  .setAction(async (taskArgs: { address: string }, _hre) => {
    const { address } = taskArgs;
    console.log(ethers.utils.getAddress(address));
  });

task('faucet', 'Mint a given BridgeToken to a user address')
  .addParam('tokenAddress', 'Address of BridgeToken')
  .addParam(
    'userAddress',
    'Address of recipient (default is deployer)',
    undefined,
    undefined,
    true,
  ) // isOptional
  .addParam('amount', 'Amount to mint', BigInt(1 * 10 ** 8).toString())
  .setAction(
    async (taskArgs: { tokenAddress?: string; userAddress?: string }, hre) => {
      const [deployer] = await hre.ethers.getSigners();
      const {
        tokenAddress,
        userAddress = deployer.address,
        amount,
      } = taskArgs as {
        tokenAddress?: string;
        userAddress?: string;
        amount: string;
      };
      if (!tokenAddress) {
        throw new Error('tokenAddress is required');
      }

      const bridgeToken = await hre.ethers.getContractAt(
        'BridgeToken',
        tokenAddress,
      );
      const tx = await bridgeToken.connect(deployer).mint(userAddress, amount);
      const receipt = await tx.wait();
      console.log(receipt);
    },
  );

task('create-admin', 'Create a new EOA with access control')
  .addOptionalParam(
    'address',
    'If this is set, grant admin role to this address without creating a new EOA',
  )
  .setAction(async (taskArgs: { address?: string }, hre) => {
    const [SUI_CONSUMER] = await hre.ethers.getSigners();
    if (!SUI_CONSUMER) {
      throw new Error('PRIVATE_KEY_SUI_CONSUMER must be set');
    }

    // Create a new EOA from scratch
    let address = taskArgs.address;
    if (!address) {
      const wallet = ethers.Wallet.createRandom();

      // print the address and private key
      address = await wallet.getAddress();
      const privateKey = wallet.privateKey;
      console.log({ address, privateKey });
    }

    // Grant for Hub
    const HubFactory = await hre.ethers.getContractFactory('Hub');
    const hub = HubFactory.connect(SUI_CONSUMER).attach(HUB_CONTRACT_ADDRESS);
    await (await hub.connect(SUI_CONSUMER).grantAdminRole(address)).wait();
    console.log('✅ Hub admin granted to:', address);

    // Grant for BridgeTokens
    for (const token of Object.values(TOKEN_ADDRESS)) {
      const bridgeToken = await hre.ethers.getContractAt('BridgeToken', token);
      await (
        await bridgeToken.connect(SUI_CONSUMER).grantAdminRole(address)
      ).wait();
      console.log(
        `✅ ${await bridgeToken.symbol()} admin granted to:`,
        address,
        'for',
        token,
      );
    }
  });

task('check-admin', 'Check if a wallet has access control')
  .addParam('address', 'Address to check')
  .setAction(async (taskArgs: { address: string }, hre) => {
    const { address } = taskArgs;

    const hub = await hre.ethers.getContractAt('Hub', HUB_CONTRACT_ADDRESS);
    const hasRole = await hub.hasRole(await hub.DEFAULT_ADMIN_ROLE(), address);
    console.log('✅', address, 'has admin role for Hub:', hasRole);

    for (const token of Object.values(TOKEN_ADDRESS)) {
      const bridgeToken = await hre.ethers.getContractAt('BridgeToken', token);
      const hasRole = await bridgeToken.hasRole(
        await bridgeToken.DEFAULT_ADMIN_ROLE(),
        address,
      );
      console.log(
        '✅',
        address,
        `has admin role for ${await bridgeToken.symbol()}:`,
        hasRole,
      );
    }
  });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: {
    compilers: [
      {
        version: '0.8.20',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2 ** 32 - 1,
          },
          metadata: {
            // do not include the metadata hash, since this is machine dependent
            // and we want all generated code to be deterministic
            // https://docs.soliditylang.org/en/v0.7.6/metadata.html
            bytecodeHash: 'none',
          },
        },
      },
    ],
    overrides: {
      '@uniswap/v3-core/contracts/libraries/Position.sol': { version: '0.7.6' },
      '@uniswap/v3-core/contracts/libraries/SqrtPriceMath.sol': {
        version: '0.7.6',
      },
      '@uniswap/v3-core/contracts/libraries/SwapMath.sol': { version: '0.7.6' },
      '@uniswap/v3-core/contracts/libraries/FullMath.sol': { version: '0.7.6' },
      '@uniswap/v3-core/contracts/libraries/Oracle.sol': { version: '0.7.6' },
      '@uniswap/v3-core/contracts/libraries/Tick.sol': { version: '0.7.6' },
      '@uniswap/v3-core/contracts/libraries/TickMath.sol': { version: '0.7.6' },
      '@uniswap/v3-core/contracts/libraries/TickBitmap.sol': {
        version: '0.7.6',
      },
      '@uniswap/v3-periphery/contracts/libraries/PoolAddress.sol': {
        version: '0.7.6',
      },
      '@uniswap/lib/contracts/libraries/AddressStringUtil.sol': {
        version: '0.7.6',
      },
      '@uniswap/lib/contracts/libraries/SafeERC20Namer.sol': {
        version: '0.7.6',
      },
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    sepolia: {
      chainId: 11155111,
      url: process.env.SEPOLIA_URL || 'https://rpc.sepolia.org',
      accounts:
        process.env.PRIVATE_KEY_SUI_CONSUMER !== undefined &&
        process.env.PRIVATE_KEY_SOLANA_CONSUMER !== undefined
          ? [
              process.env.PRIVATE_KEY_SUI_CONSUMER,
              process.env.PRIVATE_KEY_SOLANA_CONSUMER,
            ]
          : [],
    },
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    // coinmarketcap: "COINMARKETCAP_API_KEY",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
