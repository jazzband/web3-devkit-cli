// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title {{contractName}} — Ownable ERC20 with controlled mint
contract {{contractName}} is ERC20, Ownable {
    uint256 public maxSupply = 10_000_000 ether;

    constructor(address initialOwner) ERC20("{{contractName}}", "MTK") Ownable(initialOwner) {
        _mint(initialOwner, 1_000_000 ether);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= maxSupply, "cap exceeded");
        _mint(to, amount);
    }

    function setMaxSupply(uint256 cap) external onlyOwner {
        maxSupply = cap;
    }
}
