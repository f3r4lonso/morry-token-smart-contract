import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying MorryToken...");

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);

  const Token = await ethers.getContractFactory("MorryToken");

  const token = await Token.deploy(1000);

  await token.waitForDeployment();

  console.log("✅ Contract deployed to:", token.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});