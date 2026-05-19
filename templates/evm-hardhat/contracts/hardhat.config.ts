import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    localhost: {
      url: process.env.RPC_URL ?? "http://127.0.0.1:8545",
    },
  },
};

export default config;
