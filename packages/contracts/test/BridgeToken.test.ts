import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { BridgeToken } from '../typechain';

describe('BridgeToken', function () {
  let token: BridgeToken;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const BridgeTokenFactory = await ethers.getContractFactory('BridgeToken');
    token = (await BridgeTokenFactory.connect(owner).deploy(
      'Wrapped Bitcoin',
      'wBTC',
      ethers.utils.parseUnits('1000', 8),
      8,
    )) as BridgeToken;
    await token.deployed();
  });

  it('Should have correct name and symbol', async function () {
    expect(await token.name()).to.equal('Wrapped Bitcoin');
    expect(await token.symbol()).to.equal('wBTC');
  });

  it('Should mint initial supply to owner', async function () {
    const ownerBalance = await token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(100000000000n);
  });

  it('Should allow owner to mint new tokens', async function () {
    await (
      await token
        .connect(owner)
        .mint(addr1.address, ethers.utils.parseUnits('500', 8))
    ).wait();
    const addr1Balance = await token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.utils.parseUnits('500', 8));
  });

  it('Should not allow non-owner to mint new tokens', async function () {
    try {
      await (
        await token
          .connect(addr1)
          .mint(addr2.address, ethers.utils.parseUnits('500', 8))
      ).wait();
      expect.fail('Transaction should have failed');
    } catch (error: any) {
      expect(error.message).to.include('OwnableUnauthorizedAccount');
    }
  });

  it('Should allow token transfers between accounts', async function () {
    await (
      await token
        .connect(owner)
        .transfer(addr1.address, ethers.utils.parseUnits('100', 8))
    ).wait();
    const addr1Balance = await token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.utils.parseUnits('100', 8));

    await (
      await token
        .connect(addr1)
        .transfer(addr2.address, ethers.utils.parseUnits('50', 8))
    ).wait();
    const addr2Balance = await token.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.utils.parseUnits('50', 8));
  });

  it('Should not allow transfers exceeding balance', async function () {
    await expect(
      token
        .connect(owner)
        .transfer(addr1.address, ethers.utils.parseUnits('1001', 8)),
    ).to.be.reverted;
  });
});
