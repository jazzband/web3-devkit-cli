// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title {{contractName}} — stake stakingToken, earn rewardsToken
contract {{contractName}} is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardsToken;

    uint256 public rewardRatePerSecond; // rewards per second per token staked (scaled)
    uint256 public totalStaked;
    uint256 public accRewardPerShare; // 1e18 precision
    uint256 public lastUpdateTime;

    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 pendingRewards;
    }

    mapping(address => UserInfo) public users;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor(
        address initialOwner,
        IERC20 stakingToken_,
        IERC20 rewardsToken_,
        uint256 rewardRatePerSecond_
    ) Ownable(initialOwner) {
        stakingToken = stakingToken_;
        rewardsToken = rewardsToken_;
        rewardRatePerSecond = rewardRatePerSecond_;
        lastUpdateTime = block.timestamp;
    }

    function setRewardRate(uint256 rate) external onlyOwner {
        _updatePool();
        rewardRatePerSecond = rate;
    }

    function stake(uint256 amount) external nonReentrant {
        _updatePool();
        UserInfo storage user = users[msg.sender];
        _harvest(msg.sender);
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        user.amount += amount;
        totalStaked += amount;
        user.rewardDebt = (user.amount * accRewardPerShare) / 1e18;
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        _updatePool();
        UserInfo storage user = users[msg.sender];
        require(user.amount >= amount, "insufficient stake");
        _harvest(msg.sender);
        user.amount -= amount;
        totalStaked -= amount;
        user.rewardDebt = (user.amount * accRewardPerShare) / 1e18;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function claim() external nonReentrant {
        _updatePool();
        _harvest(msg.sender);
        UserInfo storage user = users[msg.sender];
        uint256 pending = user.pendingRewards;
        user.pendingRewards = 0;
        user.rewardDebt = (user.amount * accRewardPerShare) / 1e18;
        if (pending > 0) rewardsToken.safeTransfer(msg.sender, pending);
        emit RewardClaimed(msg.sender, pending);
    }

    function _harvest(address account) internal {
        UserInfo storage user = users[account];
        uint256 accumulated = (user.amount * accRewardPerShare) / 1e18;
        if (accumulated > user.rewardDebt) {
            user.pendingRewards += accumulated - user.rewardDebt;
        }
    }

    function _updatePool() internal {
        if (block.timestamp <= lastUpdateTime || totalStaked == 0) {
            lastUpdateTime = block.timestamp;
            return;
        }
        uint256 elapsed = block.timestamp - lastUpdateTime;
        accRewardPerShare += (elapsed * rewardRatePerSecond * 1e18) / totalStaked;
        lastUpdateTime = block.timestamp;
    }
}
