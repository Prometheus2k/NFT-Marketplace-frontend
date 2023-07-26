const hre = require("hardhat");

async function main() {
  const nftMarketplace = await hre.ethers.deployContract("NFTMarketplace");

  await nftMarketplace.waitForDeployment();

  console.log(`deployed to ${nftMarketplace.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
