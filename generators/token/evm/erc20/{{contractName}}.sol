// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title {{contractName}} — ERC20 token
contract {{contractName}} is ERC20, Ownable {
    constructor(address initialOwner)
        ERC20("{{contractName}}", "{{contractName}}")
        Ownable(initialOwner)
    {
        _mint(initialOwner, 1_000_000 ether);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
