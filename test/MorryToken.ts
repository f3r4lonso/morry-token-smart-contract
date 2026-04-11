import { expect } from "chai";
import { ethers } from "hardhat";

describe("MorryToken", function () {
  async function deployTokenFixture() {
    const [owner, addr1] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MorryToken");
    const token = await Token.deploy(1000);

    return { token, owner, addr1 };
  }

  it("Should assign initial supply to owner", async function () {
    const { token, owner } = await deployTokenFixture();

    const balance = await token.balanceOf(owner.address);

    expect(balance).to.equal(ethers.parseUnits("1000", 18));
  });

  it("Owner should be able to mint tokens", async function () {
    const { token, addr1 } = await deployTokenFixture();

    await token.mint(addr1.address, 100);

    const balance = await token.balanceOf(addr1.address);

    expect(balance).to.equal(ethers.parseUnits("100", 18));
  });

  it("Non-owner should NOT be able to mint", async function () {
    const { token, addr1 } = await deployTokenFixture();

    await expect(
      token.connect(addr1).mint(addr1.address, 100)
    ).to.be.reverted;
  });

  it("Should allow users to burn their tokens", async function () {
    const { token, owner } = await deployTokenFixture();

    await token.burn(100);

    const balance = await token.balanceOf(owner.address);

    expect(balance).to.equal(ethers.parseUnits("900", 18));
  });

  it("Should reduce total supply when burning", async function () {
    const { token } = await deployTokenFixture();

    await token.burn(100);

    const totalSupply = await token.totalSupply();

    expect(totalSupply).to.equal(ethers.parseUnits("900", 18));
  });
});