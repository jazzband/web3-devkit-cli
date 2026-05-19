// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title {{contractName}} — Merkle airdrop claim
contract {{contractName}} is Ownable {
    IERC20 public immutable token;
    bytes32 public merkleRoot;
    mapping(address => bool) public claimed;

    event Claimed(address indexed account, uint256 amount);

    constructor(address initialOwner, IERC20 token_, bytes32 merkleRoot_)
        Ownable(initialOwner)
    {
        token = token_;
        merkleRoot = merkleRoot_;
    }

    function setMerkleRoot(bytes32 root) external onlyOwner {
        merkleRoot = root;
    }

    function claim(uint256 amount, bytes32[] calldata proof) external {
        require(!claimed[msg.sender], "already claimed");
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "invalid proof");
        claimed[msg.sender] = true;
        require(token.transfer(msg.sender, amount), "transfer failed");
        emit Claimed(msg.sender, amount);
    }
}
