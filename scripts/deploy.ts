import { ethers } from "hardhat";

async function main() {
  const initialSupply = BigInt(process.env.INITIAL_SUPPLY ?? "1000000");
  const [deployer] = await ethers.getSigners();

  console.log("Deploying MorryToken with account:", deployer.address);
  console.log("Initial supply:", initialSupply.toString(), "MORRY");

  const tokenFactory = await ethers.getContractFactory("MorryToken");
  const token = await tokenFactory.deploy(initialSupply);

  await token.waitForDeployment();

  console.log("MorryToken deployed to:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
