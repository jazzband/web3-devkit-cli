// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title {{contractName}} — binary prediction market skeleton
/// @notice Simplified yes/no market — audit and extend before production
contract {{contractName}} is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable collateral;
    uint256 public immutable endTime;
    bool public resolved;
    bool public outcomeYes;

    uint256 public yesPool;
    uint256 public noPool;
    mapping(address => uint256) public yesStake;
    mapping(address => uint256) public noStake;

    event BetYes(address indexed user, uint256 amount);
    event BetNo(address indexed user, uint256 amount);
    event Resolved(bool outcomeYes);
    event Claimed(address indexed user, uint256 amount);

    constructor(address initialOwner, IERC20 collateral_, uint256 endTime_)
        Ownable(initialOwner)
    {
        collateral = collateral_;
        endTime = endTime_;
    }

    function betYes(uint256 amount) external nonReentrant {
        require(block.timestamp < endTime, "closed");
        require(!resolved, "resolved");
        collateral.safeTransferFrom(msg.sender, address(this), amount);
        yesStake[msg.sender] += amount;
        yesPool += amount;
        emit BetYes(msg.sender, amount);
    }

    function betNo(uint256 amount) external nonReentrant {
        require(block.timestamp < endTime, "closed");
        require(!resolved, "resolved");
        collateral.safeTransferFrom(msg.sender, address(this), amount);
        noStake[msg.sender] += amount;
        noPool += amount;
        emit BetNo(msg.sender, amount);
    }

    function resolve(bool outcomeYes_) external onlyOwner {
        require(block.timestamp >= endTime, "not ended");
        require(!resolved, "resolved");
        resolved = true;
        outcomeYes = outcomeYes_;
        emit Resolved(outcomeYes_);
    }

    function claim() external nonReentrant {
        require(resolved, "not resolved");
        uint256 stake = outcomeYes ? yesStake[msg.sender] : noStake[msg.sender];
        require(stake > 0, "nothing to claim");
        uint256 pool = outcomeYes ? yesPool : noPool;
        uint256 total = yesPool + noPool;
        uint256 payout = (stake * total) / pool;
        if (outcomeYes) yesStake[msg.sender] = 0;
        else noStake[msg.sender] = 0;
        collateral.safeTransfer(msg.sender, payout);
        emit Claimed(msg.sender, payout);
    }
}
