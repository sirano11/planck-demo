import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { ERC20Mock, ERC20Mock__factory, Hub, Hub__factory } from '../typechain';

describe('Hub', function () {
  let hub: Hub;
  let token: ERC20Mock;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const HubFactory = (await ethers.getContractFactory('Hub')) as Hub__factory;
    hub = await HubFactory.deploy();
    await hub.deployed();

    const ERC20MockFactory = (await ethers.getContractFactory(
      'ERC20Mock',
    )) as ERC20Mock__factory;
    token = await ERC20MockFactory.deploy(
      'Mock Token',
      'MTK',
      owner.address,
      ethers.utils.parseEther('1000'),
    );
    await token.deployed();

    // Transfer some tokens to the Hub contract for testing
    await token.transfer(hub.address, ethers.utils.parseEther('100'));
  });

  describe('transfer', function () {
    it('Should allow admin to transfer tokens', async function () {
      const transferAmount = ethers.utils.parseEther('10');
      await expect(hub.transfer(addr1.address, token.address, transferAmount))
        .to.emit(token, 'Transfer')
        .withArgs(hub.address, addr1.address, transferAmount);

      expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it('Should not allow non-admin to transfer tokens', async function () {
      const transferAmount = ethers.utils.parseEther('10');
      await expect(
        hub
          .connect(addr1)
          .transfer(addr2.address, token.address, transferAmount),
      ).to.be.revertedWith('AccessControlUnauthorizedAccount');
    });
  });

  describe('grantAdminRole', function () {
    it('Should allow admin to grant admin role to another address', async function () {
      await expect(hub.grantAdminRole(addr1.address))
        .to.emit(hub, 'RoleGranted')
        .withArgs(ethers.constants.HashZero, addr1.address, owner.address);

      expect(await hub.hasRole(ethers.constants.HashZero, addr1.address)).to.be
        .true;
    });

    it('Should not allow non-admin to grant admin role', async function () {
      await expect(
        hub.connect(addr1).grantAdminRole(addr2.address),
      ).to.be.revertedWith('AccessControlUnauthorizedAccount');
    });

    it('Should allow new admin to transfer tokens', async function () {
      await hub.grantAdminRole(addr1.address);
      const transferAmount = ethers.utils.parseEther('10');

      await expect(
        hub
          .connect(addr1)
          .transfer(addr2.address, token.address, transferAmount),
      )
        .to.emit(token, 'Transfer')
        .withArgs(hub.address, addr2.address, transferAmount);

      expect(await token.balanceOf(addr2.address)).to.equal(transferAmount);
    });
  });
});
