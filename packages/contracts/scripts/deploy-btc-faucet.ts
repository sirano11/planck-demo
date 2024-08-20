import { ethers } from 'hardhat';
import { TOKEN_ADDRESS } from 'planck-demo-interface/src/helper/eth/config';

// Deploy script to deploy wBTC faucet
async function main() {
  const [admin] = await ethers.getSigners();
  if (!admin) {
    throw new Error('Signer not found');
  }

  console.log('Deploying contracts with the account:', admin.address);

  const BridgeTokenFactory = await ethers.getContractFactory('BridgeToken');
  const wBTC = BridgeTokenFactory.connect(admin).attach(TOKEN_ADDRESS.wBTC);
  console.log('Using wBTC at:', wBTC.address);

  // Deploy Faucet
  const FaucetFactory = await ethers.getContractFactory('Faucet');
  const faucet = await FaucetFactory.connect(admin).deploy(wBTC.address);
  await faucet.deployed();
  console.log('✅ Faucet deployed to:', faucet.address);

  // Grant role to faucet
  await (await wBTC.connect(admin).grantAdminRole(faucet.address)).wait();

  console.log('✅ wBTC role granted to:', faucet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
