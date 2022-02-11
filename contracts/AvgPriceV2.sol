// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./DateTime.sol";
import "./Diamond/libraries/LibDiamond.sol";
import "./AvgPriceV1.sol";

contract AvgPriceV2 is AvgPriceV1 {

    // set price for a day
    // version2: Only Owner can set everyday price of a token.
    function setDayPrice(
        uint8 _month, 
        uint8 _day,
        uint256 _price
    ) external virtual override onlyValidDate(_month, _day) {
        LibDiamond.enforceIsContractOwner();
        dailyPrice[_month][_day] = _price;
        totalPrice[_month][_day] = prevTotalPrice(_month, _day) + _price;
    }
}