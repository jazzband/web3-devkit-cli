// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title {{contractName}} — ERC20 with buy/sell tax
contract {{contractName}} is ERC20, Ownable {
    uint256 public buyTaxBps = 200; // 2%
    uint256 public sellTaxBps = 300; // 3%
    address public treasury;

    mapping(address => bool) public isExempt;

    constructor(address initialOwner, address treasury_)
        ERC20("{{contractName}}", "{{contractName}}")
        Ownable(initialOwner)
    {
        treasury = treasury_;
        isExempt[initialOwner] = true;
        isExempt[treasury_] = true;
        isExempt[address(this)] = true;
        _mint(initialOwner, 1_000_000 ether);
    }

    function setTax(uint256 buyBps, uint256 sellBps) external onlyOwner {
        require(buyBps <= 1000 && sellBps <= 1000, "max 10%");
        buyTaxBps = buyBps;
        sellTaxBps = sellBps;
    }

    function setExempt(address account, bool exempt) external onlyOwner {
        isExempt[account] = exempt;
    }

    function _update(address from, address to, uint256 value) internal override {
        if (from == address(0) || to == address(0) || isExempt[from] || isExempt[to]) {
            super._update(from, to, value);
            return;
        }

        uint256 taxBps = from == address(this) || to == address(this) ? 0 : (to == treasury ? sellTaxBps : buyTaxBps);
        uint256 tax = (value * taxBps) / 10_000;
        uint256 send = value - tax;

        super._update(from, to, send);
        if (tax > 0) super._update(from, treasury, tax);
    }
}
