import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  const ERC20Mock = await ethers.getContractFactory('ERC20Mock');

  // wBTC token deploy (Quantity matched 1:1 to the actual maximum supply of Bitcoin)
  const wBTC = await ERC20Mock.deploy(
    'Wrapped Bitcoin',
    'wBTC',
    ethers.utils.parseEther('21000000'),
  );
  await wBTC.deployed();
  console.log('wBTC deployed to:', wBTC.address);

  // lMint token deploy
  const lMint = await ERC20Mock.deploy(
    'Liquid Mint',
    'lMint',
    ethers.utils.parseEther('1000000000'),
  );
  await lMint.deployed();
  console.log('lMint deployed to:', lMint.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
