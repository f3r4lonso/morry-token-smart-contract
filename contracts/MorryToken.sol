// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MorryToken
 * @dev ERC-20 token con mint controlado y burn.
 */
contract MorryToken is ERC20, Ownable {
    uint256 public immutable MAX_SUPPLY;

    constructor(uint256 maxSupply)
        ERC20("Morry Token", "MORRY")
        Ownable(msg.sender)
    {
        require(maxSupply > 0, "Invalid max supply");
        MAX_SUPPLY = maxSupply;
        _mint(msg.sender, maxSupply);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount * 10 ** decimals());
    }
}
