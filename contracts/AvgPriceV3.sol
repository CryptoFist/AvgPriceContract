// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./DateTime.sol";
import "hardhat/console.sol";

contract AvgPriceV3 is OwnableUpgradeable {

    DateTime private dateUtil;
    mapping(uint8 => mapping(uint8 => uint256)) private dailyPrice;
    mapping(uint8 => mapping(uint8 => uint256)) private totalPrice;

    function initialize() public initializer {
        __Ownable_init();
    }

    modifier onlyValidDate(
        uint8 _month, 
        uint8 _day
    ) {
        uint16 _year = dateUtil.getYear(block.timestamp);
        require(_month > 0 && _month <= 12, "Invalide Month");
        require(_day > 0 && _day <= dateUtil.getDaysInMonth(_month, _year), "Invalide Day");
        _;
    }

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
    ) external onlyOwner onlyToday(_month, _day) {
        dailyPrice[_month][_day] = _price;
        totalPrice[_month][_day] = prevTotalPrice(_month, _day) + _price;
    }

    // view price for a day
    function getDayPrice(
        uint8 _month,
        uint8 _day
    ) external view onlyValidDate(_month, _day) returns(uint256) {
        return dailyPrice[_month][_day];
    }

    // view average price
    // average token price from _Aug_ to _Sept_ out of 1 year data (_Jan_-_Dec_)
    function getAvgPrice() external view returns(uint256) {
        uint256 curTime = block.timestamp;
        uint8 curMonth = dateUtil.getMonth(curTime);
        uint8 curDay = dateUtil.getDay(curTime);

        if (curMonth < 8) {
            return 0;
        }

        if (curMonth <= 9) {
            curDay = totalPrice[curMonth][curDay] == 0 ? curDay - 1 : curDay;
            uint16 totalDayCount = curMonth == 8 ? curDay : (31 + curDay);
            uint256 _totalPrice = totalPrice[curMonth][curDay] == 0 ? prevTotalPrice(curMonth, curDay) : totalPrice[curMonth][curDay];
            uint256 avgPrice = _totalPrice / totalDayCount;
            return avgPrice;
        } else {
            uint16 totalDayCount = 31 + 30; // Aug: 31, Sep: 30
            uint256 _totalPrice = totalPrice[9][30] - totalPrice[8][1];
            uint256 avgPrice = _totalPrice / totalDayCount;
            return avgPrice;
        }
    }

    // TODO test function to check getAvgPrice function works fine.
    function getAvgPriceWithDate(
        uint8 _fromMonth, 
        uint8 _fromDay, 
        uint8 _toMonth, 
        uint8 _toDay
    ) external view 
        onlyValidDate(_fromMonth, _fromDay)
        onlyValidDate(_toMonth, _toDay)
        onlyOwner returns(uint256) 
    {
       require(_toMonth > _fromMonth || (_toMonth == _fromMonth && _toDay >= _fromDay), "FromDay is after ToDay");

        uint256 _fromTotal = totalPrice[_fromMonth][_fromDay];
        uint256 _toTotal = totalPrice[_toMonth][_toDay];

        console.log("fromTotal is %s", _fromTotal);
        console.log("toTotal is %s", _toTotal);

        require(_toTotal >= _fromTotal, "Invalide period");

        uint16 betweenDays = calcBetweenDays(_fromMonth, _fromDay, _toMonth, _toDay);
        console.log("betweenDays is %s", betweenDays);
        uint256 _avgPrice = (_toTotal - _fromTotal) / betweenDays;
        
        return _avgPrice;
    }

    function calcBetweenDays(
        uint8 _fromMonth, 
        uint8 _fromDay, 
        uint8 _toMonth, 
        uint8 _toDay
    ) private view returns(uint16) 
    {
        uint8[12] memory monthlyDayCnt = [31,28,31,30,31,30,31,31,30,31,30,31];
        uint16 betweenDays;

        if (_fromMonth == _toMonth) {
            betweenDays = _toDay - _fromDay + 1;
        } else {
            uint16 curYear = dateUtil.getYear(block.timestamp);
            if (dateUtil.isLeapYear(curYear)){
                monthlyDayCnt[1] = 29;
            }
            betweenDays = dateUtil.getDaysInMonth(_fromMonth, curYear);
            betweenDays = betweenDays - _fromDay + 1;
            for (uint8 i = _fromMonth + 1; i < _toMonth; i ++) {
                betweenDays += monthlyDayCnt[i];
            }
            betweenDays += _toDay;
        }
        return betweenDays;
    }

    function prevTotalPrice(
        uint8 _curMonth,
        uint8 _curDay
    ) private view returns (uint256 _totalPrice) {
        if (_curMonth == 1 && _curDay == 1) {
            _totalPrice = 0;
        } else {
            uint16 _curYear = dateUtil.getYear(block.timestamp);
            uint8 lastMonthDay = dateUtil.getDaysInMonth(_curMonth - 1, _curYear);
            if (_curDay == 1) {
                _totalPrice = totalPrice[_curMonth - 1][lastMonthDay];
            } else {
                _totalPrice = totalPrice[_curMonth][_curDay - 1];
            }
        }
    }
}