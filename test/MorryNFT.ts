import { expect } from "chai";
import { ethers } from "hardhat";

describe("MorryNFT", function () {
  const tokenURI = "ipfs://metadata/morry-1.json";

  async function deployNFTFixture() {
    const [owner, minter, creator, other] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("MorryNFT");
    const morryNFT = await NFT.deploy();

    return { morryNFT, owner, minter, creator, other };
  }

  it("sets collection metadata and owner on deployment", async function () {
    const { morryNFT, owner } = await deployNFTFixture();

    expect(await morryNFT.name()).to.equal("Morry NFT");
    expect(await morryNFT.symbol()).to.equal("MNFT");
    expect(await morryNFT.owner()).to.equal(owner.address);
    expect(await morryNFT.nextTokenId()).to.equal(1n);
  });

  it("allows the owner to set the minter", async function () {
    const { morryNFT, minter } = await deployNFTFixture();

    await expect(morryNFT.setMinter(minter.address))
      .to.emit(morryNFT, "MinterUpdated")
      .withArgs(ethers.ZeroAddress, minter.address);

    expect(await morryNFT.minter()).to.equal(minter.address);
  });

  it("rejects zero address as minter", async function () {
    const { morryNFT } = await deployNFTFixture();

    await expect(morryNFT.setMinter(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(morryNFT, "InvalidMinter");
  });

  it("prevents non owners from setting the minter", async function () {
    const { morryNFT, minter, other } = await deployNFTFixture();

    await expect(morryNFT.connect(other).setMinter(minter.address))
      .to.be.revertedWithCustomError(morryNFT, "OwnableUnauthorizedAccount")
      .withArgs(other.address);
  });

  it("allows the configured minter to mint NFTs with metadata", async function () {
    const { morryNFT, minter, creator } = await deployNFTFixture();

    await morryNFT.setMinter(minter.address);

    await morryNFT.connect(minter).mint(creator.address, tokenURI);

    expect(await morryNFT.ownerOf(1)).to.equal(creator.address);
    expect(await morryNFT.tokenURI(1)).to.equal(tokenURI);
    expect(await morryNFT.nextTokenId()).to.equal(2n);
  });

  it("increments token IDs for each mint", async function () {
    const { morryNFT, minter, creator, other } = await deployNFTFixture();

    await morryNFT.setMinter(minter.address);

    await morryNFT.connect(minter).mint(creator.address, tokenURI);
    await morryNFT.connect(minter).mint(other.address, "ipfs://metadata/morry-2.json");

    expect(await morryNFT.ownerOf(1)).to.equal(creator.address);
    expect(await morryNFT.ownerOf(2)).to.equal(other.address);
    expect(await morryNFT.nextTokenId()).to.equal(3n);
  });

  it("prevents accounts other than the minter from minting", async function () {
    const { morryNFT, creator } = await deployNFTFixture();

    await expect(morryNFT.connect(creator).mint(creator.address, tokenURI))
      .to.be.revertedWithCustomError(morryNFT, "NotMinter")
      .withArgs(creator.address);
  });
});
