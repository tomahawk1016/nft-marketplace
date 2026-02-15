const hre = require("hardhat");
const dotenv = require('dotenv')
const fs = require('fs')

function replaceEnvContractAddresses(marketplaceAddress, nftAddress) {
  const envFileName = './frontend/.env'
  const envFile = fs.readFileSync(envFileName, 'utf-8')
  const env = dotenv.parse(envFile)
  env[`VITE_MARKETPLACE_CONTRACT_ADDRESS`] = marketplaceAddress
  env[`VITE_NFT_CONTRACT_ADDRESS`] = nftAddress
  const newEnv = Object.entries(env).reduce((env, [key, value]) => {
    return `${env}${key}=${value}\n`
  }, '')

  fs.writeFileSync(envFileName, newEnv)
}

async function main() {
  const NFT = await hre.ethers.deployContract("NFT", [], { gasLimit: 2_000_000 });
  const nft = await NFT.waitForDeployment();
  const nftAddress = await nft.getAddress();

  const Marketplace = await hre.ethers.deployContract("Marketplace", [], { gasLimit: 3_000_000 });
  const marketplace = await Marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();

  console.log("NFT:", nftAddress);
  console.log("Marketplace:", marketplaceAddress);
  replaceEnvContractAddresses(marketplaceAddress, nftAddress)
}

main();