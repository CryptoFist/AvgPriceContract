import { Contract, ContractFactory } from "ethers";
import { run, ethers, upgrades } from "hardhat";

async function main() {
  let avgFactoryV1: ContractFactory;
  let avgFactoryV2: ContractFactory;
  let avgFactoryV3: ContractFactory;
  let datetimeFactory: ContractFactory;

  let avgContractV1: Contract;
  let avgContractV2: Contract;
  let avgContractV3: Contract;
  let datetimeContract: Contract;
  
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  datetimeFactory = await ethers.getContractFactory('DateTime');
  avgFactoryV1 = await ethers.getContractFactory('AvgPriceV1');
  avgFactoryV2 = await ethers.getContractFactory('AvgPriceV2');
  avgFactoryV3 = await ethers.getContractFactory('AvgPriceV3');

  datetimeContract = await datetimeFactory.deploy();
  datetimeContract.deployed();
  console.log(`datetimeContract address is ${datetimeContract.address}`);

  avgContractV1 = await upgrades.deployProxy(avgFactoryV1, [datetimeContract.address]);
  await avgContractV1.deployed();
  console.log(`avgContractV1 address is ${avgContractV1.address}`);

  avgContractV2 = await upgrades.upgradeProxy(avgContractV1.address, avgFactoryV2);
  console.log(`AvgPriceV2 contract address is ${avgContractV2.address}`);

  avgContractV3 = await upgrades.upgradeProxy(avgContractV2.address, avgFactoryV3);
  console.log(`AvgPriceV3 contract address is ${avgContractV3.address}`);

  console.log("Deployed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });