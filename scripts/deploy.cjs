const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("DEPLOYER_PRIVATE_KEY is not configured");

  console.log(`Deploying BorrowBond from ${deployer.address}...`);
  const BorrowBond = await hre.ethers.getContractFactory("BorrowBond");
  const contract = await BorrowBond.deploy();
  await contract.waitForDeployment();
  console.log(`BorrowBond deployed to: ${await contract.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
