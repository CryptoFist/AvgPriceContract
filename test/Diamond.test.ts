import {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets
} from '../scripts/libraries/diamond';

import { deployDiamond } from '../scripts/deploy_diamond';
import { assert } from 'chai';
import { ethers } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

describe('DiamondTest', async function () {
  let diamondAddress: any
  let diamondContract: Contract
  let diamondCutFacet: Contract
  let diamondLoupeFacet: Contract
  let ownershipFacet: Contract
  let tx: any
  let receipt: any
  let result: any
  const addresses: any = []

  before(async function () {
    diamondContract = await deployDiamond()
    diamondAddress = diamondContract.address
    diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
    diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
    // ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)
  })

  it('should have three facets -- call to facetAddresses function', async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address)
    }

    assert.equal(addresses.length, 2)
  })

  it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
    let selectors = getSelectors(diamondCutFacet)
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0])
    assert.sameMembers(result, selectors)
    selectors = getSelectors(diamondLoupeFacet)
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1])
    assert.sameMembers(result, selectors)
  })

  it('selectors should be associated to facets correctly -- multiple calls to facetAddress function', async () => {
    assert.equal(
      addresses[0],
      await diamondLoupeFacet.facetAddress('0x1f931c1c')
    )
    assert.equal(
      addresses[1],
      await diamondLoupeFacet.facetAddress('0xcdffacc6')
    )
    assert.equal(
      addresses[1],
      await diamondLoupeFacet.facetAddress('0x01ffc9a7')
    )
  })
  let datetimeContract: Contract
  it('should add avgPriceV1 functions', async () => {
    let datetimeFactory: ContractFactory = await ethers.getContractFactory('DateTime')
    datetimeContract = await datetimeFactory.deploy()
    datetimeContract.deployed()
    console.log(`dateTime address address is ${datetimeContract.address}`);

    let avgFactoryV1: ContractFactory = await ethers.getContractFactory('AvgPriceV1')
    let avgContractV1: Contract = await avgFactoryV1.deploy()
    await avgContractV1.deployed()
    console.log(`avgContractV1 address is ${avgContractV1.address}`);

    addresses.push(avgContractV1.address);

    const selectors = getSelectors(avgContractV1)
    tx = await diamondCutFacet.diamondCut(
      [{
        facetAddress: avgContractV1.address,
        action: FacetCutAction.Add,
        functionSelectors: selectors
      }],
      ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    result = await diamondLoupeFacet.facetFunctionSelectors(avgContractV1.address)
    assert.sameMembers(result, selectors)
  })

  it('should test avgPriceV1 function call', async () => {
    const avgContractV1 = await ethers.getContractAt('AvgPriceV1', diamondAddress)
    
    await avgContractV1.setDateUtilAddress(datetimeContract.address);
    const avgPrice = await avgContractV1.getAvgPrice();
    assert.equal(avgPrice, 0);

    await avgContractV1.setDayPrice(2, 1, 10);
    const dayPrice = await avgContractV1.getDayPrice(2, 1);
    assert.equal(dayPrice, 10);
  })

  it('should replace avgPriceV2 functions', async () => {
      let avgFactoryV2: ContractFactory = await ethers.getContractFactory('AvgPriceV2')
      let avgContractV2: Contract = await avgFactoryV2.deploy()
      await avgContractV2.deployed()

      console.log(`avgContractV2 address is ${avgContractV2}`);

      addresses.push(avgContractV2.address);
    
      let selector = getSelectors(avgContractV2)
      let selectors = selector;

      const v2FacetAddress = addresses[3]
      tx = await diamondCutFacet.diamondCut(
        [{
          facetAddress: v2FacetAddress,
          action: FacetCutAction.Replace,
          functionSelectors: selectors
        }],
        ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
      receipt = await tx.wait()
      if (!receipt.status) {
        throw Error(`Diamond upgrade failed: ${tx.hash}`)
      }
      result = await diamondLoupeFacet.facetFunctionSelectors(v2FacetAddress)
      assert.sameMembers(result, getSelectors(avgContractV2))
  })

  it('should check that functino replaced correctly', async () => {
    const avgContractV2 = await ethers.getContractAt('AvgPriceV2', diamondAddress)

    const dayPrice = await avgContractV2.getDayPrice(2, 1);
    assert.equal(dayPrice, 10);
  })

  it('should replace avgPriceV3 functions', async () => {
    let avgFactoryV3: ContractFactory = await ethers.getContractFactory('AvgPriceV3')
    let avgContractV3: Contract = await avgFactoryV3.deploy()
    await avgContractV3.deployed()

    console.log(`avgContractV3 address is ${avgContractV3}`);

    addresses.push(avgContractV3.address);
  
    let selector = getSelectors(avgContractV3)
    let selectors = selector;

    const v3FacetAddress = addresses[4]
    tx = await diamondCutFacet.diamondCut(
      [{
        facetAddress: v3FacetAddress,
        action: FacetCutAction.Replace,
        functionSelectors: selectors
      }],
      ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    result = await diamondLoupeFacet.facetFunctionSelectors(v3FacetAddress)
    assert.sameMembers(result, getSelectors(avgContractV3))
  })

  it('should check that function replaced correctly', async () => {
    const avgContractV3 = await ethers.getContractAt('AvgPriceV3', diamondAddress)

    const dayPrice = await avgContractV3.getDayPrice(2, 1);
      assert.equal(dayPrice, 10);

    await avgContractV3.setDayPrice(2, 11, 10);
  })
})
