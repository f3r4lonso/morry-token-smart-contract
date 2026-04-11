import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import type { HardhatUserConfig } from "hardhat/config";

const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;
const sepoliaPrivateKey = process.env.SEPOLIA_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    ...(sepoliaRpcUrl && sepoliaPrivateKey
      ? {
          sepolia: {
            url: sepoliaRpcUrl,
            accounts: [sepoliaPrivateKey],
          },
        }
      : {}),
  },
};

export default config;
