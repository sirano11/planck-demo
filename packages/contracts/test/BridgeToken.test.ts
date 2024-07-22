import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { TOKENS } from '../constants/tokens';
import { BridgeToken } from '../typechain';

describe('BridgeToken', function () {
  let token: BridgeToken;
  let wsolToken: BridgeToken;
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

    const wSOLMetadata = TOKENS.find((t) => t.symbol === 'wSOL')!;
    wsolToken = (await BridgeTokenFactory.connect(owner).deploy(
      wSOLMetadata.name,
      wSOLMetadata.symbol,
      ethers.utils.parseUnits('123', wSOLMetadata.decimals),
      wSOLMetadata.decimals,
    )) as BridgeToken;
    await wsolToken.deployed();
  });

  describe('ERC20', function () {
    it('Should have correct name and symbol', async function () {
      expect(await token.name()).to.equal('Wrapped Bitcoin');
      expect(await token.symbol()).to.equal('wBTC');
    });

    it('Should have correct decimals', async function () {
      expect(await token.decimals()).to.equal(8);
      expect(await wsolToken.decimals()).to.equal(9);
    });

    it('Should mint initial supply to owner', async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(100000000000n);

      const ownerBalanceOfwSOL = await wsolToken.balanceOf(owner.address);
      expect(ownerBalanceOfwSOL).to.equal(123_000_000_000n);
    });

    it('Should allow token transfers between accounts', async function () {
      await expect(
        token
          .connect(owner)
          .transfer(addr1.address, ethers.utils.parseUnits('100', 8)),
      )
        .to.emit(token, 'Transfer')
        .withArgs(
          owner.address,
          addr1.address,
          ethers.utils.parseUnits('100', 8),
        );

      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.utils.parseUnits('100', 8));

      await expect(
        token
          .connect(addr1)
          .transfer(addr2.address, ethers.utils.parseUnits('50', 8)),
      )
        .to.emit(token, 'Transfer')
        .withArgs(
          addr1.address,
          addr2.address,
          ethers.utils.parseUnits('50', 8),
        );

      const addr2Balance = await token.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(ethers.utils.parseUnits('50', 8));
    });

    it('Should not allow transfers exceeding balance', async function () {
      await expect(
        token
          .connect(owner)
          .transfer(addr1.address, ethers.utils.parseUnits('1001', 8)),
      ).to.be.revertedWith('ERC20InsufficientBalance');
    });
  });

  describe('Access Control', function () {
    it('Should allow admin to mint new tokens', async function () {
      await expect(
        token
          .connect(owner)
          .mint(addr1.address, ethers.utils.parseUnits('500', 8)),
      )
        .to.emit(token, 'Transfer')
        .withArgs(
          ethers.constants.AddressZero,
          addr1.address,
          ethers.utils.parseUnits('500', 8),
        );

      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.utils.parseUnits('500', 8));
    });

    it('Should not allow non-admin to mint new tokens', async function () {
      await expect(
        token
          .connect(addr1)
          .mint(addr2.address, ethers.utils.parseUnits('500', 8)),
      ).to.be.revertedWith('AccessControlUnauthorizedAccount');
    });

    it('Should allow admin to grant admin role', async function () {
      await expect(token.connect(owner).grantAdminRole(addr1.address))
        .to.emit(token, 'RoleGranted')
        .withArgs(ethers.constants.HashZero, addr1.address, owner.address);

      // Now addr1 should be able to mint
      await expect(
        token
          .connect(addr1)
          .mint(addr2.address, ethers.utils.parseUnits('500', 8)),
      )
        .to.emit(token, 'Transfer')
        .withArgs(
          ethers.constants.AddressZero,
          addr2.address,
          ethers.utils.parseUnits('500', 8),
        );
    });

    it('Should allow admin to revoke admin role', async function () {
      await token.connect(owner).grantAdminRole(addr1.address);

      await expect(token.connect(owner).revokeAdminRole(addr1.address))
        .to.emit(token, 'RoleRevoked')
        .withArgs(ethers.constants.HashZero, addr1.address, owner.address);

      // Now addr1 should not be able to mint
      await expect(
        token
          .connect(addr1)
          .mint(addr2.address, ethers.utils.parseUnits('500', 8)),
      ).to.be.revertedWith('AccessControlUnauthorizedAccount');
    });
  });
});
