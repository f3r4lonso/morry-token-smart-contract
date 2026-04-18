// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./MorryNFT.sol";

/**
 * @title MorryNFTStore
 * @dev Marketplace that mints, lists, and sells Morry NFTs using MORRY tokens.
 *
 * The store connects the ERC-20 token and the ERC-721 collection. It charges
 * MORRY to create NFTs, keeps track of active listings, transfers MORRY from
 * buyers to sellers, and transfers NFTs from sellers to buyers.
 */
contract MorryNFTStore is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Listing {
        address seller;
        uint256 price;
    }

    IERC20 public immutable morryToken;
    MorryNFT public immutable morryNFT;
    address public treasury;
    uint256 public mintPrice;

    mapping(uint256 tokenId => Listing) private _listings;

    event NFTCreated(address indexed creator, uint256 indexed tokenId, string tokenURI);
    event NFTListed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event NFTSold(address indexed buyer, address indexed seller, uint256 indexed tokenId, uint256 price);
    event ListingCancelled(address indexed seller, uint256 indexed tokenId);
    event MintPriceUpdated(uint256 previousPrice, uint256 newPrice);
    event TreasuryUpdated(address indexed previousTreasury, address indexed newTreasury);

    error InvalidAddress();
    error InvalidPrice();
    error NotTokenOwner();
    error StoreNotApproved();
    error ListingNotActive();
    error NotListingSeller();
    error SellerCannotBuyOwnNFT();

    /**
     * @dev Creates the marketplace and stores the MORRY token, NFT collection, treasury, and mint price.
     *
     * `morryTokenAddress` points to the ERC-20 token used for all payments.
     * `morryNFTAddress` points to the NFT collection this marketplace can mint
     * and trade. `treasuryAddress` receives the MORRY paid when users create
     * NFTs. `initialMintPrice` is stored in ERC-20 base units, so 1 MORRY is
     * `1 * 10 ** 18` for the current token.
     *
     * The constructor rejects zero addresses because a marketplace with a
     * missing token, NFT collection, or treasury would be unusable and could
     * trap funds or break minting.
     *
     * @param morryTokenAddress Address of the ERC-20 token used as marketplace currency.
     * @param morryNFTAddress Address of the ERC-721 collection minted and traded by this store.
     * @param treasuryAddress Account that receives MORRY paid for NFT creation.
     * @param initialMintPrice Price required to create one NFT, expressed in MORRY base units.
     */
    constructor(address morryTokenAddress, address morryNFTAddress, address treasuryAddress, uint256 initialMintPrice)
        Ownable(msg.sender)
    {
        if (morryTokenAddress == address(0) || morryNFTAddress == address(0) || treasuryAddress == address(0)) {
            revert InvalidAddress();
        }

        morryToken = IERC20(morryTokenAddress);
        morryNFT = MorryNFT(morryNFTAddress);
        treasury = treasuryAddress;
        mintPrice = initialMintPrice;
    }

    /**
     * @dev Charges the caller the mint price in MORRY and mints a new NFT to them.
     *
     * The caller must approve this marketplace to spend at least `mintPrice`
     * MORRY before calling this function. The MORRY payment is transferred to
     * `treasury`, then the NFT contract mints a new token to the caller.
     *
     * The function is protected by `nonReentrant` because it moves ERC-20 tokens
     * and mints ERC-721 tokens in one transaction. The NFT contract must have
     * this store configured as its minter with `MorryNFT.setMinter`.
     *
     * @param tokenURI_ Metadata URI for the NFT, usually an IPFS URI.
     * @return tokenId The ID assigned to the newly created NFT.
     */
    function createNFT(string calldata tokenURI_) external nonReentrant returns (uint256) {
        morryToken.safeTransferFrom(msg.sender, treasury, mintPrice);

        uint256 tokenId = morryNFT.mint(msg.sender, tokenURI_);

        emit NFTCreated(msg.sender, tokenId, tokenURI_);

        return tokenId;
    }

    /**
     * @dev Lists an owned NFT for sale in exchange for MORRY tokens.
     *
     * The caller must own `tokenId`, the `price` must be greater than zero, and
     * this marketplace must be approved to transfer the NFT. Approval can be
     * granted for a single token with `approve(store, tokenId)` or for the full
     * collection with `setApprovalForAll(store, true)`.
     *
     * Listing only records the seller and price. The NFT remains in the seller
     * wallet until someone buys it, which keeps custody with the user while the
     * listing is active.
     *
     * @param tokenId ID of the NFT that will be listed.
     * @param price Sale price expressed in MORRY base units.
     */
    function listNFT(uint256 tokenId, uint256 price) external {
        if (price == 0) {
            revert InvalidPrice();
        }

        if (morryNFT.ownerOf(tokenId) != msg.sender) {
            revert NotTokenOwner();
        }

        if (
            morryNFT.getApproved(tokenId) != address(this)
                && !morryNFT.isApprovedForAll(msg.sender, address(this))
        ) {
            revert StoreNotApproved();
        }

        _listings[tokenId] = Listing({seller: msg.sender, price: price});

        emit NFTListed(msg.sender, tokenId, price);
    }

    /**
     * @dev Buys an active listing by transferring MORRY to the seller and the NFT to the buyer.
     *
     * The buyer must approve this marketplace to spend at least the listing
     * price in MORRY before calling this function. The seller cannot buy their
     * own NFT. The function also verifies that the recorded seller still owns
     * the NFT, which protects buyers from stale listings after manual transfers.
     *
     * The listing is deleted before external token transfers happen. That order
     * keeps the contract state clean if a receiver contract tries to reenter
     * during the ERC-721 transfer.
     *
     * @param tokenId ID of the listed NFT to buy.
     */
    function buyNFT(uint256 tokenId) external nonReentrant {
        Listing memory listing = _listings[tokenId];

        if (listing.seller == address(0)) {
            revert ListingNotActive();
        }

        if (listing.seller == msg.sender) {
            revert SellerCannotBuyOwnNFT();
        }

        if (morryNFT.ownerOf(tokenId) != listing.seller) {
            revert NotTokenOwner();
        }

        delete _listings[tokenId];

        morryToken.safeTransferFrom(msg.sender, listing.seller, listing.price);
        IERC721(address(morryNFT)).safeTransferFrom(listing.seller, msg.sender, tokenId);

        emit NFTSold(msg.sender, listing.seller, tokenId, listing.price);
    }

    /**
     * @dev Cancels an active NFT listing. Only the listing seller can cancel it.
     *
     * Cancelling removes the listing from marketplace storage but does not move
     * the NFT because the NFT has stayed in the seller wallet the entire time.
     * If the token is not actively listed, the call reverts.
     *
     * @param tokenId ID of the NFT listing to cancel.
     */
    function cancelListing(uint256 tokenId) external {
        Listing memory listing = _listings[tokenId];

        if (listing.seller == address(0)) {
            revert ListingNotActive();
        }

        if (listing.seller != msg.sender) {
            revert NotListingSeller();
        }

        delete _listings[tokenId];

        emit ListingCancelled(msg.sender, tokenId);
    }

    /**
     * @dev Updates the MORRY price required to create one NFT. Only the owner can call it.
     *
     * This controls the creation fee charged by `createNFT`. The value is stored
     * in ERC-20 base units. For MORRY, `ethers.parseUnits("1", 18)` represents
     * 1 MORRY. Setting this to zero would make NFT creation free.
     *
     * @param newMintPrice New mint price expressed in MORRY base units.
     */
    function updateMintPrice(uint256 newMintPrice) external onlyOwner {
        uint256 previousMintPrice = mintPrice;
        mintPrice = newMintPrice;

        emit MintPriceUpdated(previousMintPrice, newMintPrice);
    }

    /**
     * @dev Updates the treasury account that receives MORRY paid for NFT creation.
     *
     * Only the marketplace owner can change the treasury. The zero address is
     * rejected so future mint payments are not sent to an unusable address.
     *
     * @param newTreasury New treasury account address.
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) {
            revert InvalidAddress();
        }

        address previousTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(previousTreasury, newTreasury);
    }

    /**
     * @dev Returns the seller and price for a token listing, or zero values when it is not listed.
     *
     * This read function is intended for frontends, scripts, and tests. A return
     * value of `(address(0), 0)` means the token does not currently have an
     * active listing in this marketplace.
     *
     * @param tokenId ID of the NFT listing to read.
     * @return seller Account selling the NFT.
     * @return price Sale price expressed in MORRY base units.
     */
    function getListing(uint256 tokenId) external view returns (address seller, uint256 price) {
        Listing memory listing = _listings[tokenId];
        return (listing.seller, listing.price);
    }
}
