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
    const [owner, addr1] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MorryToken");
    const token = await Token.deploy(1000);

    await token.mint(addr1.address, 100);

    const balance = await token.balanceOf(addr1.address);

    expect(balance).to.equal(ethers.parseUnits("100", 18));
  });
});