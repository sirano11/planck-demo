import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { ERC20Mock } from '../typechain';

describe('ERC20Mock', function () {
  let token: ERC20Mock;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  const tokenName = 'Test wBTC';
  const tokenSymbol = 'twBTC';
  const tokenSupply = ethers.utils.parseEther('1000');

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const ERC20MockFactory = await ethers.getContractFactory('ERC20Mock');
    token = (await ERC20MockFactory.deploy(
      tokenName,
      tokenSymbol,
      tokenSupply,
    )) as ERC20Mock;
    await token.deployed();
  });

  it('Should have correct name and symbol', async function () {
    expect(await token.name()).to.equal(tokenName);
    expect(await token.symbol()).to.equal(tokenSymbol);
  });

  it('Should mint initial supply to owner', async function () {
    const ownerBalance = await token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(tokenSupply);
  });

  it('Should allow owner to mint new tokens', async function () {
    await token.mint(addr1.address, ethers.utils.parseEther('500'));
    const addr1Balance = await token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.utils.parseEther('500'));
  });

  it('Should not allow non-owner to mint new tokens', async function () {
    try {
      await token
        .connect(addr1)
        .mint(addr2.address, ethers.utils.parseEther('500'));
      expect.fail('Transaction should have failed');
    } catch (error: any) {
      expect(error.message).to.include('OwnableUnauthorizedAccount');
    }
  });

  it('Should allow token transfers between accounts', async function () {
    await token.transfer(addr1.address, ethers.utils.parseEther('100'));
    const addr1Balance = await token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.utils.parseEther('100'));

    await token
      .connect(addr1)
      .transfer(addr2.address, ethers.utils.parseEther('50'));
    const addr2Balance = await token.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.utils.parseEther('50'));
  });

  it('Should not allow transfers exceeding balance', async function () {
    await expect(token.transfer(addr1.address, ethers.utils.parseEther('1001')))
      .to.be.reverted;
  });
});
