// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MorryToken
 * @dev ERC-20 token used as the currency of the Morry ecosystem.
 *
 * The token reuses OpenZeppelin ERC20 for the standard token behavior and
 * OpenZeppelin Ownable for privileged minting. Amounts passed to custom
 * functions are intentionally expressed in whole MORRY units, then converted
 * internally to ERC-20 base units using the token decimals.
 */
contract MorryToken is ERC20, Ownable {

    /**
     * @dev Creates the MORRY token and mints the initial supply to the deployer.
     *
     * The ERC20 constructor sets the human-readable name and symbol. The Ownable
     * constructor sets the deployer as the initial owner, which means only that
     * account can call owner-only functions such as `mint`.
     *
     * `initialSupply` is multiplied by `10 ** decimals()` so passing `1000`
     * creates exactly 1000 MORRY tokens with the default 18 ERC-20 decimals.
     *
     * @param initialSupply Token amount expressed in whole MORRY units.
     */
    constructor(uint256 initialSupply)
        ERC20("Morry Token", "MORRY")
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    /**
     * @dev Mints new MORRY tokens to an account. Only the contract owner can call it.
     *
     * This function increases both the recipient balance and the total supply.
     * It is useful for controlled supply expansion, rewards, testnet funding, or
     * treasury operations. The `onlyOwner` modifier prevents arbitrary accounts
     * from creating tokens.
     *
     * The `amount` parameter is expressed in whole MORRY units for developer
     * convenience. For example, `mint(user, 50)` mints 50 MORRY, not 50 wei-like
     * base units.
     *
     * @param to Account that will receive the minted tokens.
     * @param amount Token amount expressed in whole MORRY units.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount * 10 ** decimals());
    }

    /**
     * @dev Burns MORRY tokens from the caller balance.
     *
     * Burning permanently removes tokens from circulation. The caller does not
     * need owner permission because they can only burn their own balance. This
     * reduces the total supply by the same amount removed from the caller.
     *
     * The `amount` parameter is expressed in whole MORRY units. For example,
     * `burn(10)` burns 10 MORRY from `msg.sender`.
     *
     * @param amount Token amount expressed in whole MORRY units.
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount * 10 ** decimals());
    }
}
