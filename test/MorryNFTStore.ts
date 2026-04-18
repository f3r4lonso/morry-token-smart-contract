import { expect } from "chai";
import { ethers } from "hardhat";

describe("MorryNFTStore", function () {
  const mintPrice = ethers.parseUnits("1", 18);
  const listingPrice = ethers.parseUnits("10", 18);
  const tokenURI = "ipfs://metadata/morry-1.json";

  async function deployStoreFixture() {
    const [owner, creator, buyer, treasury, other] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MorryToken");
    const morryToken = await Token.deploy(1000);

    const NFT = await ethers.getContractFactory("MorryNFT");
    const morryNFT = await NFT.deploy();

    const Store = await ethers.getContractFactory("MorryNFTStore");
    const store = await Store.deploy(
      await morryToken.getAddress(),
      await morryNFT.getAddress(),
      treasury.address,
      mintPrice
    );

    await morryNFT.setMinter(await store.getAddress());

    await morryToken.transfer(creator.address, ethers.parseUnits("50", 18));
    await morryToken.transfer(buyer.address, ethers.parseUnits("50", 18));

    return { morryToken, morryNFT, store, owner, creator, buyer, treasury, other };
  }

  async function createNFTFixture() {
    const fixture = await deployStoreFixture();
    const { morryToken, store, creator } = fixture;

    await morryToken.connect(creator).approve(await store.getAddress(), mintPrice);
    await store.connect(creator).createNFT(tokenURI);

    return { ...fixture, tokenId: 1n };
  }

  async function listedNFTFixture() {
    const fixture = await createNFTFixture();
    const { morryNFT, store, creator, tokenId } = fixture;

    await morryNFT.connect(creator).approve(await store.getAddress(), tokenId);
    await store.connect(creator).listNFT(tokenId, listingPrice);

    return fixture;
  }

  async function expectListing(store: any, tokenId: bigint, seller: string, price: bigint) {
    const listing = await store.getListing(tokenId);

    expect(listing[0]).to.equal(seller);
    expect(listing[1]).to.equal(price);
  }

  it("sets marketplace configuration on deployment", async function () {
    const { morryToken, morryNFT, store, owner, treasury } = await deployStoreFixture();

    expect(await store.owner()).to.equal(owner.address);
    expect(await store.morryToken()).to.equal(await morryToken.getAddress());
    expect(await store.morryNFT()).to.equal(await morryNFT.getAddress());
    expect(await store.treasury()).to.equal(treasury.address);
    expect(await store.mintPrice()).to.equal(mintPrice);
  });

  it("rejects zero addresses on deployment", async function () {
    const { morryToken, morryNFT, treasury } = await deployStoreFixture();
    const Store = await ethers.getContractFactory("MorryNFTStore");

    await expect(Store.deploy(ethers.ZeroAddress, await morryNFT.getAddress(), treasury.address, mintPrice))
      .to.be.revertedWithCustomError(Store, "InvalidAddress");

    await expect(Store.deploy(await morryToken.getAddress(), ethers.ZeroAddress, treasury.address, mintPrice))
      .to.be.revertedWithCustomError(Store, "InvalidAddress");

    await expect(Store.deploy(await morryToken.getAddress(), await morryNFT.getAddress(), ethers.ZeroAddress, mintPrice))
      .to.be.revertedWithCustomError(Store, "InvalidAddress");
  });

  it("charges 1 MORRY and mints an NFT to the creator", async function () {
    const { morryToken, morryNFT, store, creator, treasury } = await deployStoreFixture();

    await morryToken.connect(creator).approve(await store.getAddress(), mintPrice);

    await expect(store.connect(creator).createNFT(tokenURI))
      .to.emit(store, "NFTCreated")
      .withArgs(creator.address, 1n, tokenURI);

    expect(await morryNFT.ownerOf(1)).to.equal(creator.address);
    expect(await morryNFT.tokenURI(1)).to.equal(tokenURI);
    expect(await morryToken.balanceOf(treasury.address)).to.equal(mintPrice);
  });

  it("does not mint without MORRY approval", async function () {
    const { store, creator } = await deployStoreFixture();

    await expect(store.connect(creator).createNFT(tokenURI)).to.be.reverted;
  });

  it("only allows the store minter to create NFTs", async function () {
    const { morryNFT, creator } = await deployStoreFixture();

    await expect(morryNFT.connect(creator).mint(creator.address, tokenURI))
      .to.be.revertedWithCustomError(morryNFT, "NotMinter")
      .withArgs(creator.address);
  });

  it("lists an owned NFT after marketplace approval", async function () {
    const { morryNFT, store, creator, tokenId } = await createNFTFixture();

    await morryNFT.connect(creator).approve(await store.getAddress(), tokenId);

    await expect(store.connect(creator).listNFT(tokenId, listingPrice))
      .to.emit(store, "NFTListed")
      .withArgs(creator.address, tokenId, listingPrice);

    await expectListing(store, tokenId, creator.address, listingPrice);
  });

  it("lists an owned NFT with operator approval", async function () {
    const { morryNFT, store, creator, tokenId } = await createNFTFixture();

    await morryNFT.connect(creator).setApprovalForAll(await store.getAddress(), true);

    await store.connect(creator).listNFT(tokenId, listingPrice);

    await expectListing(store, tokenId, creator.address, listingPrice);
  });

  it("rejects listings with a zero price", async function () {
    const { morryNFT, store, creator, tokenId } = await createNFTFixture();

    await morryNFT.connect(creator).approve(await store.getAddress(), tokenId);

    await expect(store.connect(creator).listNFT(tokenId, 0))
      .to.be.revertedWithCustomError(store, "InvalidPrice");
  });

  it("rejects listings from non owners", async function () {
    const { morryNFT, store, buyer, tokenId } = await createNFTFixture();

    await morryNFT.connect(buyer).setApprovalForAll(await store.getAddress(), true);

    await expect(store.connect(buyer).listNFT(tokenId, listingPrice))
      .to.be.revertedWithCustomError(store, "NotTokenOwner");
  });

  it("rejects listings without NFT approval", async function () {
    const { store, creator, tokenId } = await createNFTFixture();

    await expect(store.connect(creator).listNFT(tokenId, listingPrice))
      .to.be.revertedWithCustomError(store, "StoreNotApproved");
  });

  it("buys a listed NFT with MORRY", async function () {
    const { morryToken, morryNFT, store, creator, buyer, tokenId } = await listedNFTFixture();
    await morryToken.connect(buyer).approve(await store.getAddress(), listingPrice);

    await expect(store.connect(buyer).buyNFT(tokenId))
      .to.emit(store, "NFTSold")
      .withArgs(buyer.address, creator.address, tokenId, listingPrice);

    expect(await morryNFT.ownerOf(tokenId)).to.equal(buyer.address);
    expect(await morryToken.balanceOf(creator.address)).to.equal(ethers.parseUnits("59", 18));
    await expectListing(store, tokenId, ethers.ZeroAddress, 0n);
  });

  it("rejects buying an inactive listing", async function () {
    const { store, buyer } = await deployStoreFixture();

    await expect(store.connect(buyer).buyNFT(999))
      .to.be.revertedWithCustomError(store, "ListingNotActive");
  });

  it("prevents the seller from buying their own NFT", async function () {
    const { store, creator, tokenId } = await listedNFTFixture();

    await expect(store.connect(creator).buyNFT(tokenId))
      .to.be.revertedWithCustomError(store, "SellerCannotBuyOwnNFT");
  });

  it("rejects stale listings when the seller no longer owns the NFT", async function () {
    const { morryNFT, morryToken, store, creator, buyer, other, tokenId } = await listedNFTFixture();

    await morryNFT.connect(creator).transferFrom(creator.address, other.address, tokenId);
    await morryToken.connect(buyer).approve(await store.getAddress(), listingPrice);

    await expect(store.connect(buyer).buyNFT(tokenId))
      .to.be.revertedWithCustomError(store, "NotTokenOwner");
  });

  it("does not buy without enough MORRY approval", async function () {
    const { store, buyer, tokenId } = await listedNFTFixture();

    await expect(store.connect(buyer).buyNFT(tokenId)).to.be.reverted;
  });

  it("allows the seller to cancel a listing", async function () {
    const { store, creator, tokenId } = await listedNFTFixture();

    await expect(store.connect(creator).cancelListing(tokenId))
      .to.emit(store, "ListingCancelled")
      .withArgs(creator.address, tokenId);

    await expectListing(store, tokenId, ethers.ZeroAddress, 0n);
  });

  it("rejects cancelling an inactive listing", async function () {
    const { store, creator } = await deployStoreFixture();

    await expect(store.connect(creator).cancelListing(999))
      .to.be.revertedWithCustomError(store, "ListingNotActive");
  });

  it("rejects cancellation from a non seller", async function () {
    const { store, other, tokenId } = await listedNFTFixture();

    await expect(store.connect(other).cancelListing(tokenId))
      .to.be.revertedWithCustomError(store, "NotListingSeller");
  });

  it("allows the owner to update the mint price", async function () {
    const { store } = await deployStoreFixture();
    const newMintPrice = ethers.parseUnits("2", 18);

    await expect(store.updateMintPrice(newMintPrice))
      .to.emit(store, "MintPriceUpdated")
      .withArgs(mintPrice, newMintPrice);

    expect(await store.mintPrice()).to.equal(newMintPrice);
  });

  it("prevents non owners from updating the mint price", async function () {
    const { store, other } = await deployStoreFixture();

    await expect(store.connect(other).updateMintPrice(ethers.parseUnits("2", 18)))
      .to.be.revertedWithCustomError(store, "OwnableUnauthorizedAccount")
      .withArgs(other.address);
  });

  it("allows the owner to update the treasury", async function () {
    const { store, treasury, other } = await deployStoreFixture();

    await expect(store.updateTreasury(other.address))
      .to.emit(store, "TreasuryUpdated")
      .withArgs(treasury.address, other.address);

    expect(await store.treasury()).to.equal(other.address);
  });

  it("rejects zero address as treasury", async function () {
    const { store } = await deployStoreFixture();

    await expect(store.updateTreasury(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(store, "InvalidAddress");
  });

  it("prevents non owners from updating the treasury", async function () {
    const { store, other } = await deployStoreFixture();

    await expect(store.connect(other).updateTreasury(other.address))
      .to.be.revertedWithCustomError(store, "OwnableUnauthorizedAccount")
      .withArgs(other.address);
  });
});
