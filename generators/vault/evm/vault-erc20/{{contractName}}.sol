// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title {{contractName}} — ERC4626 token vault
contract {{contractName}} is ERC4626, Ownable {
    constructor(IERC20 asset_, address initialOwner)
        ERC4626(asset_)
        Ownable(initialOwner)
    {}

    /// @dev Example: owner can rescue stray tokens (not underlying)
    function rescueERC20(IERC20 token, address to, uint256 amount) external onlyOwner {
        require(address(token) != address(asset()), "cannot rescue asset");
        token.transfer(to, amount);
    }
}
