# Morry Token and Morry NFT Store

Morry started as a simple ERC-20 token project and now evolves into a small NFT marketplace ecosystem.

The project contains:

- `MorryToken`: ERC-20 token used as the currency of the ecosystem.
- `MorryNFT`: ERC-721 collection for NFTs created through the store.
- `MorryNFTStore`: marketplace contract that charges MORRY to create NFTs and lets users list, buy, and cancel NFT sales.

## Current Deployment

Morry Token is already deployed on Sepolia:

- Network: Sepolia
- MorryToken: `0xadACc94d2d784127F78f5C34A3093545DcA14EFe`
- Etherscan: https://sepolia.etherscan.io/address/0xadACc94d2d784127F78f5C34A3093545DcA14EFe

The NFT collection and NFT store can be deployed with `scripts/deploy-nft-store.ts`.

## Architecture

### MorryToken

`contracts/MorryToken.sol`

ERC-20 token built with OpenZeppelin.

Main features:

- Standard ERC-20 behavior: `transfer`, `approve`, `transferFrom`, `balanceOf`.
- Owner-controlled minting through `mint`.
- User burning through `burn`.
- 18 decimals, inherited from OpenZeppelin ERC-20.

Custom methods use whole MORRY units. For example:

```solidity
mint(user, 100)
burn(10)
```

That means 100 MORRY and 10 MORRY. Internally the contract converts those values to ERC-20 base units.

### MorryNFT

`contracts/MorryNFT.sol`

ERC-721 NFT collection built with OpenZeppelin `ERC721URIStorage`.

Main features:

- Stores metadata URI per NFT.
- Uses sequential token IDs starting at 1.
- Restricts minting to a configured `minter`.
- Designed so `MorryNFTStore` is the minter.

Important methods:

```solidity
setMinter(address newMinter)
mint(address to, string calldata tokenURI_)
nextTokenId()
```

Users should not mint directly from this contract. They create NFTs through `MorryNFTStore`, which enforces the MORRY creation fee.

### MorryNFTStore

`contracts/MorryNFTStore.sol`

Marketplace contract that connects `MorryToken` and `MorryNFT`.

Main features:

- Creates NFTs by charging MORRY.
- Creation price defaults to 1 MORRY when deployed with the included script.
- Lets users list NFTs for sale.
- Lets buyers purchase listed NFTs using MORRY.
- Lets sellers cancel active listings.
- Lets the owner update the mint price and treasury.

Important methods:

```solidity
createNFT(string calldata tokenURI_)
listNFT(uint256 tokenId, uint256 price)
buyNFT(uint256 tokenId)
cancelListing(uint256 tokenId)
updateMintPrice(uint256 newMintPrice)
updateTreasury(address newTreasury)
getListing(uint256 tokenId)
```

## User Flows

### Create an NFT

1. User uploads an image somewhere off-chain, usually IPFS.
2. User creates NFT metadata JSON with image, name, and description.
3. Metadata JSON is uploaded, usually to IPFS.
4. User approves the store to spend 1 MORRY:

```solidity
morryToken.approve(morryNFTStoreAddress, 1 ether)
```

5. User creates the NFT:

```solidity
morryNFTStore.createNFT("ipfs://metadata-uri")
```

The store transfers 1 MORRY from the user to the treasury, then mints the NFT to the user.

### List an NFT for sale

1. Seller approves the store to transfer the NFT:

```solidity
morryNFT.approve(morryNFTStoreAddress, tokenId)
```

or:

```solidity
morryNFT.setApprovalForAll(morryNFTStoreAddress, true)
```

2. Seller lists the NFT:

```solidity
morryNFTStore.listNFT(tokenId, price)
```

`price` is expressed in MORRY base units. For example, 10 MORRY is `10 ether` in Solidity or `ethers.parseUnits("10", 18)` in TypeScript.

### Buy an NFT

1. Buyer approves the store to spend MORRY:

```solidity
morryToken.approve(morryNFTStoreAddress, price)
```

2. Buyer purchases the NFT:

```solidity
morryNFTStore.buyNFT(tokenId)
```

The store transfers MORRY from buyer to seller and transfers the NFT from seller to buyer.

### Cancel a listing

Only the seller can cancel their own listing:

```solidity
morryNFTStore.cancelListing(tokenId)
```

## Installation

```bash
npm install
```

## Compile

```bash
npm run compile
```

The project compiles with Solidity `0.8.28` and `evmVersion: "cancun"` because the installed OpenZeppelin version uses Cancun-compatible EVM instructions.

## Test

```bash
npm test
```

Current test coverage includes:

- `MorryToken`
  - Initial supply.
  - Metadata and owner.
  - Owner minting.
  - Non-owner mint rejection.
  - Burning.
  - Total supply reduction after burn.
- `MorryNFT`
  - Collection metadata.
  - Owner setup.
  - Minter setup.
  - Rejection of invalid minter.
  - Restricted minting.
  - Metadata URI storage.
  - Token ID increments.
- `MorryNFTStore`
  - Constructor configuration.
  - Invalid address rejection.
  - NFT creation with 1 MORRY payment.
  - Creation rejection without MORRY approval.
  - Listing with token approval.
  - Listing with operator approval.
  - Invalid listing rejection.
  - Buying with MORRY.
  - Buying rejection for inactive or stale listings.
  - Seller self-buy rejection.
  - Cancellation by seller.
  - Cancellation rejection by non-seller.
  - Mint price updates.
  - Treasury updates.

## Deploy MorryToken

Local:

```bash
npm run deploy:localhost
```

Sepolia:

```bash
npm run deploy:sepolia
```

Required `.env` values for Sepolia:

```env
SEPOLIA_RPC_URL=YOUR_RPC_URL
SEPOLIA_PRIVATE_KEY=YOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

## Deploy MorryNFTStore

Local:

```bash
npm run deploy:nft-store:localhost
```

Sepolia:

```bash
npm run deploy:nft-store:sepolia
```

If `MORRY_TOKEN_ADDRESS` is set in `.env`, the deploy script reuses that token address. If it is not set, the script deploys a new `MorryToken` for the selected network.

Recommended Sepolia `.env`:

```env
SEPOLIA_RPC_URL=YOUR_RPC_URL
SEPOLIA_PRIVATE_KEY=YOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
MORRY_TOKEN_ADDRESS=0xadACc94d2d784127F78f5C34A3093545DcA14EFe
```

The NFT store deploy script:

1. Reuses or deploys `MorryToken`.
2. Deploys `MorryNFT`.
3. Deploys `MorryNFTStore`.
4. Sets `MorryNFTStore` as the minter of `MorryNFT`.
5. Uses `1 MORRY` as the initial NFT creation price.

## Security Notes

- Contracts use OpenZeppelin implementations.
- `MorryNFT` restricts minting to one configured minter.
- `MorryNFTStore` uses `SafeERC20` for MORRY transfers.
- `MorryNFTStore` uses `ReentrancyGuard` for functions that move tokens/NFTs.
- Listings are removed before external transfers in `buyNFT`.
- The store checks that the seller still owns the NFT before a purchase.
- NFT creation requires ERC-20 approval from the user.
- NFT sale requires ERC-721 approval from the seller.

## Project Structure

```text
contracts/
  MorryToken.sol
  MorryNFT.sol
  MorryNFTStore.sol
scripts/
  deploy.ts
  deploy-nft-store.ts
test/
  MorryToken.ts
  MorryNFT.ts
  MorryNFTStore.ts
morry-nft-store/
  Reserved for the future frontend.
```

## Future Work

- Build the frontend inside `morry-nft-store`.
- Add IPFS upload support for NFT images and metadata.
- Add marketplace fees for secondary sales.
- Add events indexing or a subgraph.
- Add ERC-2981 royalties if creators should earn royalties on resales.
- Add contract verification commands for Sepolia.

## License

MIT
