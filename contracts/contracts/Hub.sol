// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract Hub {
    enum ChainIdentifier {
        Ethereum,
        Solana,
        Sui,
        TON
    }

    event MsgCommitted(
        address asset,
        uint256 amount,
        ChainIdentifier indexed chain,
        address indexed sender,
        bytes32 indexed actor,
        bytes data
    );

    function commit(
        address asset,
        uint256 amount,
        // destination chain identifier
        ChainIdentifier chain,
        // actor address in destination chain
        bytes32 actor,
        // if it's too long, throw it to 3rd party storage (ipfs, arweave, p2p gossip networks etc.)
        bytes memory data
    ) public {
        // Transfer the tokens to this contract for "locking"
        require(
            IERC20(asset).transferFrom(msg.sender, address(this), amount),
            'Token transfer failed'
        );

        // Emit the event for the third-party indexer
        emit MsgCommitted(asset, amount, chain, msg.sender, actor, data);
    }
}
