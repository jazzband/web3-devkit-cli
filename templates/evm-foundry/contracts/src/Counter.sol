// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Counter — example contract for {{projectName}}
contract Counter {
    uint256 public number;

    function setNumber(uint256 newNumber) external {
        number = newNumber;
    }

    function increment() external {
        number++;
    }
}
