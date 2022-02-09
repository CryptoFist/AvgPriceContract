import { Contract, ContractFactory } from "ethers";
const { ethers, upgrades } = require("hardhat");

const { expect, assert } = require('chai');
const { BigNumber } = require('ethers');

describe('AvgPrice contract', function () {
  let avgFactoryV1: ContractFactory;
  let avgFactoryV2: ContractFactory;
  let avgFactoryV3: ContractFactory;
  let datetimeFactory: ContractFactory;

  let avgContractV1: Contract;
  let avgContractV2: Contract;
  let avgContractV3: Contract;
  let datetimeContract: Contract;

  before(async function () {
    datetimeFactory = await ethers.getContractFactory('DateTime');
    avgFactoryV1 = await ethers.getContractFactory('AvgPriceV1');
    avgFactoryV2 = await ethers.getContractFactory('AvgPriceV2');
    avgFactoryV3 = await ethers.getContractFactory('AvgPriceV3');

    datetimeContract = await datetimeFactory.deploy();
    datetimeContract.deployed();
    console.log(`datetimeContract address is ${datetimeContract.address}`);

  });

  describe ('Check AvgPriceV1 contract', function () {
    it ('Deploy AvgPriceV1', async function() {
      avgContractV1 = await upgrades.deployProxy(avgFactoryV1, [datetimeContract.address]);
      await avgContractV1.deployed();
      console.log(`avgContractV1 address is ${avgContractV1.address}`);
    });
    it ('Set day price should be success', async function() {
      await avgContractV1.setDayPrice(8, 1, ethers.utils.parseEther("10"));
      const dayPrice: number = await avgContractV1.getDayPrice(8, 1);
      assert.equal(dayPrice, BigInt(10 * 10**18));
    });

    it ('Get avg Price from Aug to Sep should be zero', async function () {
      const avgPrice: number = await avgContractV1.getAvgPrice();
      assert.equal(avgPrice, 0);  // because today is before Aug
    });
  });

  describe ('Check AvgPriceV2 contract', function () {
    it ('Deploy avgPriceV2 contract.', async function () {
      avgContractV2 = await upgrades.upgradeProxy(avgContractV1.address, avgFactoryV2);
      console.log(`AvgPriceV2 contract address is ${avgContractV2.address}`);
    });

    it ('Check that v1 data is saved', async function () {
      const dayPrice: BigInt = await avgContractV2.getDayPrice(8, 1);
      assert.equal(dayPrice, BigInt(10 * 10**18));
    });

    it ('Calling set daily price function by owner should be success', async function () {
      await avgContractV2.setDayPrice(8, 2, ethers.utils.parseEther("3"));
      const dailyPrice: number = await avgContractV2.getDayPrice(8, 2);
      assert.equal(dailyPrice, BigInt(3 * 10**18));
    });

    it ('Calling set daily price function by not owner should be fail', async function () {
      let error: boolean = false;
      try {
        const [owner, addr1] = await ethers.getSigners();
        await avgContractV2.connect(addr1).setDayPrice(8, 2, 3);
      } catch(e) {
        error = true;
      }
      assert.equal(error, true);
    });
  });

  describe ('Check AvgPriceV3 contract', function () {
    it ('Deploy avgPriceV3 contract.', async function () {
      avgContractV3 = await upgrades.upgradeProxy(avgContractV2.address, avgFactoryV3);
      console.log(`AvgPriceV3 contract address is ${avgContractV3.address}`);
    });

    it ('Check that v2 data is saved', async function () {
      let dayPrice: BigInt = await avgContractV3.getDayPrice(8, 1);
      assert.equal(dayPrice, BigInt(10 * 10**18));

      dayPrice = await avgContractV3.getDayPrice(8, 2);
      assert.equal(dayPrice, BigInt(3 * 10**18));
    });

    it ('Calling set daily price function by owner should be success', async function () {
      await avgContractV3.setDayPrice(2, 9, ethers.utils.parseEther("5"));
      const dailyPrice: number = await avgContractV3.getDayPrice(2, 9);
      assert.equal(dailyPrice, BigInt(5 * 10**18));
    });

    it ('Calling set not today price function should be success should be faile even if called by owner', async function () {
      let error: boolean = false;
      try {
        await avgContractV3.setDayPrice(8, 3, ethers.utils.parseEther("5"));
      } catch(e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it ('Calling set daily price function by not owner should be fail', async function () {
      let error: boolean = false;
      try {
        const [owner, addr1] = await ethers.getSigners();
        await avgContractV3.connect(addr1).setDayPrice(8, 4, 6);
      } catch(e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it ('Calculate the avg price in avgPriceV3', async function () {
      const avgPrice: number = await avgContractV3.getAvgPriceWithDate(8, 1, 8, 2);
      assert.equal(avgPrice, 15 * 10**17);
    });
  });

});