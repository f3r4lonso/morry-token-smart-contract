// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title MorryNFT
 * @dev ERC-721 collection minted through the Morry NFT Store.
 *
 * This contract only manages NFT ownership and metadata. It does not collect
 * MORRY payments itself. Payment rules live in MorryNFTStore, while this
 * contract exposes a restricted `mint` function that only the configured
 * marketplace/minter can call.
 */
contract MorryNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    address public minter;

    event MinterUpdated(address indexed previousMinter, address indexed newMinter);

    error NotMinter(address caller);
    error InvalidMinter();

    /**
     * @dev Creates the Morry NFT collection and assigns ownership to the deployer.
     *
     * The ERC721 constructor sets the collection name and symbol. The Ownable
     * constructor sets `msg.sender` as owner so the deployer can configure the
     * marketplace address that will be allowed to mint NFTs.
     */
    constructor() ERC721("Morry NFT", "MNFT") Ownable(msg.sender) {}

    /**
     * @dev Restricts minting actions to the configured marketplace/minter address.
     *
     * The NFT store must be set as `minter` before users can create NFTs through
     * the marketplace. If any other account calls a protected function, the call
     * reverts with the caller address for easier debugging.
     */
    modifier onlyMinter() {
        if (msg.sender != minter) {
            revert NotMinter(msg.sender);
        }
        _;
    }

    /**
     * @dev Sets the address allowed to mint NFTs. Intended to be the MorryNFTStore contract.
     *
     * Only the collection owner can update this value. Keeping a single minter
     * protects the payment flow: users cannot mint directly from this contract
     * and avoid the 1 MORRY creation fee enforced by MorryNFTStore.
     *
     * The zero address is rejected because it would disable minting accidentally
     * and make the store unable to create NFTs until fixed by the owner.
     *
     * @param newMinter Contract or account that will be allowed to mint NFTs.
     */
    function setMinter(address newMinter) external onlyOwner {
        if (newMinter == address(0)) {
            revert InvalidMinter();
        }

        address previousMinter = minter;
        minter = newMinter;

        emit MinterUpdated(previousMinter, newMinter);
    }

    /**
     * @dev Mints a new NFT to the given account and stores its metadata URI.
     *
     * Token IDs start at 1 and increase by one for every mint. `_safeMint` is
     * used instead of `_mint` so contracts receiving NFTs must explicitly support
     * ERC-721 transfers, reducing the risk of NFTs being locked in incompatible
     * contracts.
     *
     * The metadata URI should normally point to a JSON document, commonly on
     * IPFS, that includes the NFT name, description, and image URL.
     *
     * @param to Account that will receive the NFT.
     * @param tokenURI_ Metadata URI for the NFT, usually an IPFS URI.
     * @return tokenId The ID assigned to the newly minted NFT.
     */
    function mint(address to, string calldata tokenURI_) external onlyMinter returns (uint256) {
        uint256 tokenId = ++_nextTokenId;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);

        return tokenId;
    }

    /**
     * @dev Returns the ID that will be assigned to the next minted NFT.
     *
     * This is a convenience read function for frontends, scripts, and tests.
     * If no NFT has been minted yet it returns 1. After token 1 is minted, it
     * returns 2, and so on.
     */
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId + 1;
    }
}
