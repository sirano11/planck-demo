// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import './BridgeToken.sol';

contract Faucet {
    ERC20 public token;

    constructor(ERC20 token_) {
        token = token_;
    }

    function requestFaucet(uint256 amount) public {
        BridgeToken(address(token)).mint(msg.sender, amount);
    }
}
