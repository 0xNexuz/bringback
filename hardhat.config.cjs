require("@nomicfoundation/hardhat-toolbox");

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 500 },
    },
  },
  networks: {
    monadTestnet: {
      url: process.env.MONAD_TESTNET_RPC_URL || "https://rpc.testnet.monad.xyz",
      chainId: 10143,
      accounts: privateKey ? [privateKey] : [],
    },
    monadMainnet: {
      url: process.env.MONAD_MAINNET_RPC_URL || "https://rpc.monad.xyz",
      chainId: 143,
      accounts: privateKey ? [privateKey] : [],
    },
  },
};
