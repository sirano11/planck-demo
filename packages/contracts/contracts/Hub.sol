// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

contract Hub is AccessControl {
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
        bytes data
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function commit(
        address asset,
        uint256 amount,
        // destination chain identifier
        ChainIdentifier chain,
        // unsigned raw tx data; if it's too long, throw it to 3rd party storage (ipfs, arweave, p2p gossip networks etc.)
        bytes memory data
    ) public {
        // Transfer the tokens to this contract for "locking"
        require(
            IERC20(asset).transferFrom(msg.sender, address(this), amount),
            'Token transfer failed'
        );

        // Emit the event for the third-party indexer
        emit MsgCommitted(asset, amount, chain, msg.sender, data);
    }

    function transfer(
        address recipient,
        address asset,
        uint256 amount
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            IERC20(asset).transfer(recipient, amount),
            'Token transfer failed'
        );
    }

    function grantAdminRole(
        address account
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(DEFAULT_ADMIN_ROLE, account);
    }

    function revokeAdminRole(
        address account
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(DEFAULT_ADMIN_ROLE, account);
    }
}
