// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title {{contractName}} — ERC1155 multi-token
contract {{contractName}} is ERC1155, Ownable {
    constructor(address initialOwner) ERC1155("") Ownable(initialOwner) {}

    function setURI(string calldata newuri) external onlyOwner {
        _setURI(newuri);
    }

    function mint(address to, uint256 id, uint256 amount, bytes memory data)
        external
        onlyOwner
    {
        _mint(to, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes memory data
    ) external onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }
}
