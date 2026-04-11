import { expect } from "chai";
import { ethers } from "hardhat";

describe("MorryToken", function () {
  it("Should assign initial supply to owner", async function () {
    const [owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MorryToken");
    const token = await Token.deploy(1000);

    const balance = await token.balanceOf(owner.address);

    expect(balance).to.equal(ethers.parseUnits("1000", 18));
  });

  it("Owner should be able to mint", async function () {
    const [, addr1] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MorryToken");
    const token = await Token.deploy(1000);

    await token.mint(addr1.address, 100);

    const balance = await token.balanceOf(addr1.address);

    expect(balance).to.equal(ethers.parseUnits("100", 18));
  });

  it("Non-owner should not be able to mint", async function () {
    const [, addr1] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MorryToken");
    const token = await Token.deploy(1000);

    await expect(token.connect(addr1).mint(addr1.address, 100))
      .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
      .withArgs(addr1.address);
  });

  it("Holder should be able to burn their tokens", async function () {
    const [owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MorryToken");
    const token = await Token.deploy(1000);

    await token.burn(100);

    const ownerBalance = await token.balanceOf(owner.address);
    const totalSupply = await token.totalSupply();

    expect(ownerBalance).to.equal(ethers.parseUnits("900", 18));
    expect(totalSupply).to.equal(ethers.parseUnits("900", 18));
  });

  it("Should revert when burning more tokens than available", async function () {
    const Token = await ethers.getContractFactory("MorryToken");
    const token = await Token.deploy(1000);

    await expect(token.burn(1001)).to.be.revertedWithCustomError(
      token,
      "ERC20InsufficientBalance"
    );
  });
});
