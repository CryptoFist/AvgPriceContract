// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./DateTime.sol";
import "hardhat/console.sol";

contract AvgPriceV1 is OwnableUpgradeable {

    DateTime private dateUtil;
    mapping(uint8 => mapping(uint8 => uint256)) private dailyPrice;
    mapping(uint8 => mapping(uint8 => uint256)) private totalPrice;

    function initialize(address _address) public initializer {
        __Ownable_init();
        dateUtil = DateTime(_address);
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

    // set price for a day
    // version1: Anyone can set everyday price of a token
    function setDayPrice(
        uint8 _month, 
        uint8 _day,
        uint256 _price
    ) external onlyValidDate(_month, _day) {
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