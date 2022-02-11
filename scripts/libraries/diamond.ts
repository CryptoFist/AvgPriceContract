/* global ethers */

import { Contract } from "ethers"
import { ethers } from "hardhat";

export const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

// get function selectors from ABI
export function getSelectors (contract: any) {
  const signatures = Object.keys(contract.interface.functions)
  const selectors: any = signatures.reduce((acc: any, val: any) => {
    if (val !== 'init(bytes)') {
      acc.push(contract.interface.getSighash(val))
    }
    return acc
  }, [])
  selectors.contract = contract
  selectors.remove = remove
  selectors.get = get
  return selectors
}

// get function selector from function signature
export function getSelector (func: any) {
  const abiInterface = new ethers.utils.Interface([func])
  return abiInterface.getSighash(ethers.utils.Fragment.from(func))
}


// used with getSelectors to remove selectors from an array of selectors
// functionNames argument is an array of function signatures
function remove (functionNames: any, selector: any) {
  const selectors = selector.filter((v: any) => {
    for (const functionName of functionNames) {
      if (v === selector.contract.interface.getSighash(functionName)) {
        return false
      }
    }
    return true
  })
  selectors.contract = selector.contract
  selectors.remove = selector.remove
  selectors.get = selector.get
  return selectors
}

// used with getSelectors to get selectors from an array of selectors
// functionNames argument is an array of function signatures
function get (functionNames: any, selector: any) {
  const selectors = selector.filter((v: any) => {
    for (const functionName of functionNames) {
      if (v === selector.contract.interface.getSighash(functionName)) {
        return true
      }
    }
    return false
  })
  selectors.contract = selector.contract
  selectors.remove = selector.remove
  selectors.get = selector.get
  return selectors
}

// remove selectors using an array of signatures
export function removeSelectors (selectors: any, signatures: any) {
  const iface = new ethers.utils.Interface(signatures.map((v: any) => 'function ' + v))
  const removeSelectors = signatures.map((v: any) => iface.getSighash(v))
  selectors = selectors.filter((v: any) => !removeSelectors.includes(v))
  return selectors
}

// find a particular address position in the return value of diamondLoupeFacet.facets()
export function findAddressPositionInFacets (facetAddress: any, facets: any) {
  for (let i = 0; i < facets.length; i++) {
    if (facets[i].facetAddress === facetAddress) {
      return i
    }
  }
}