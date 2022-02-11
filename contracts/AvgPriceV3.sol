// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DateTime.sol";
import "hardhat/console.sol";
import "./AvgPriceV2.sol";

contract AvgPriceV3 is AvgPriceV1 {

    modifier onlyToday(
        uint8 _month,
        uint8 _day
    )  {
        uint256 curTime = block.timestamp;
        uint16 curYear = dateUtil.getYear(curTime);
        uint8 curMonth = dateUtil.getMonth(curTime);
        uint8 curDay = dateUtil.getDay(curTime);
        console.log("curMonth is %s", curMonth);
        console.log("curDay is %s", curDay);

        require(_month > 0 && _month <= 12, "Invalide Month");
        require(_day > 0 && _day <= dateUtil.getDaysInMonth(_month, curYear), "Invalide Day");
        require(_day == curDay && _month == curMonth, "Allow only today");
        _;
    }

    // set price for a day
    // version3: The price of a token on a day can be set on the same day itself
    function setDayPrice(
        uint8 _month, 
        uint8 _day,
        uint256 _price
    ) external virtual override onlyToday(_month, _day) {
        LibDiamond.enforceIsContractOwner();
        dailyPrice[_month][_day] = _price;
        totalPrice[_month][_day] = prevTotalPrice(_month, _day) + _price;
    }

    // // TODO test function to check getAvgPrice function works fine.
    // function getAvgPriceWithDate(
    //     uint8 _fromMonth, 
    //     uint8 _fromDay, 
    //     uint8 _toMonth, 
    //     uint8 _toDay
    // ) external view 
    //     onlyValidDate(_fromMonth, _fromDay)
    //     onlyValidDate(_toMonth, _toDay)
    //     onlyOwner returns(uint256) 
    // {
    //    require(_toMonth > _fromMonth || (_toMonth == _fromMonth && _toDay >= _fromDay), "FromDay is after ToDay");

    //     uint256 _fromTotal = totalPrice[_fromMonth][_fromDay];
    //     uint256 _toTotal = totalPrice[_toMonth][_toDay];

    //     console.log("fromTotal is %s", _fromTotal);
    //     console.log("toTotal is %s", _toTotal);

    //     require(_toTotal >= _fromTotal, "Invalide period");

    //     uint16 betweenDays = calcBetweenDays(_fromMonth, _fromDay, _toMonth, _toDay);
    //     console.log("betweenDays is %s", betweenDays);
    //     uint256 _avgPrice = (_toTotal - _fromTotal) / betweenDays;
        
    //     return _avgPrice;
    // }

    // function calcBetweenDays(
    //     uint8 _fromMonth, 
    //     uint8 _fromDay, 
    //     uint8 _toMonth, 
    //     uint8 _toDay
    // ) private view returns(uint16) 
    // {
    //     uint8[12] memory monthlyDayCnt = [31,28,31,30,31,30,31,31,30,31,30,31];
    //     uint16 betweenDays;

    //     if (_fromMonth == _toMonth) {
    //         betweenDays = _toDay - _fromDay + 1;
    //     } else {
    //         uint16 curYear = dateUtil.getYear(block.timestamp);
    //         if (dateUtil.isLeapYear(curYear)){
    //             monthlyDayCnt[1] = 29;
    //         }
    //         betweenDays = dateUtil.getDaysInMonth(_fromMonth, curYear);
    //         betweenDays = betweenDays - _fromDay + 1;
    //         for (uint8 i = _fromMonth + 1; i < _toMonth; i ++) {
    //             betweenDays += monthlyDayCnt[i];
    //         }
    //         betweenDays += _toDay;
    //     }
    //     return betweenDays;
    // }
}