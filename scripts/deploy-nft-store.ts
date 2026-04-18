import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const mintPrice = ethers.parseUnits("1", 18);

  console.log("Deploying Morry NFT Store ecosystem...");
  console.log("Deployer:", deployer.address);

  let morryTokenAddress = process.env.MORRY_TOKEN_ADDRESS;

  if (!morryTokenAddress) {
    console.log("MORRY_TOKEN_ADDRESS not found. Deploying a new MorryToken for this network...");

    const Token = await ethers.getContractFactory("MorryToken");
    const morryToken = await Token.deploy(1000);
    await morryToken.waitForDeployment();

    morryTokenAddress = await morryToken.getAddress();
  }

  const NFT = await ethers.getContractFactory("MorryNFT");
  const morryNFT = await NFT.deploy();
  await morryNFT.waitForDeployment();

  const Store = await ethers.getContractFactory("MorryNFTStore");
  const store = await Store.deploy(
    morryTokenAddress,
    await morryNFT.getAddress(),
    deployer.address,
    mintPrice
  );
  await store.waitForDeployment();

  await morryNFT.setMinter(await store.getAddress());

  console.log("MorryToken:", morryTokenAddress);
  console.log("MorryNFT:", await morryNFT.getAddress());
  console.log("MorryNFTStore:", await store.getAddress());
  console.log("Mint price:", ethers.formatUnits(mintPrice, 18), "MORRY");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
