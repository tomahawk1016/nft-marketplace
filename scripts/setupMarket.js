const hre = require("hardhat");
require("dotenv").config({ path: "./frontend/.env" });

const dogsMetadataUrl =
  "https://ipfs.io/ipfs/Qma1wY9HLfdWbRr1tDPpVCfbtPPvjnai1rEukuqSxk6PWb";
const techEventMetadataUrl =
  "https://ipfs.io/ipfs/QmchRqWmRiHP2uXBGxT7sJJUJChDddHpyApoH94S3VkH42";
const yellowCrownMetadataUrl =
  "https://ipfs.io/ipfs/QmVXBCJcDtgtZfx77W86iG5hrJnFjWz1HV7naHAJMArqNT";
const ashleyMetadataUrl =
  "https://ipfs.io/ipfs/QmdiA6eywkjMAVGTYRXerSQozLEBA3QpKmAt1E1mKVovhz";

async function getMintedTokenId(tx) {
  const receipt = await tx.wait();
  const event = receipt.logs.find(
    log => log.fragment && log.fragment.name === "Minted"
  );
  return event.args.tokenId;
}

async function setupMarket(marketplaceAddress, nftAddress) {
  marketplaceAddress =
    marketplaceAddress ||
    process.env[`VITE_MARKETPLACE_CONTRACT_ADDRESS`];

  nftAddress =
    nftAddress ||
    process.env[`VITE_NFT_CONTRACT_ADDRESS`];

  const marketplace = await hre.ethers.getContractAt(
    "Marketplace",
    marketplaceAddress
  );
  const nft = await hre.ethers.getContractAt("NFT", nftAddress);

  const [seller, buyer, bidder2] = await hre.ethers.getSigners();

  const price = hre.ethers.parseEther("0.01");

  // --------------------
  // SELLER mints NFTs
  // --------------------
  const dogsTx = await nft.mint(dogsMetadataUrl, { gasLimit: 300_000 });
  const dogsTokenId = await getMintedTokenId(dogsTx);

  const techTx = await nft.mint(techEventMetadataUrl);
  const techTokenId = await getMintedTokenId(techTx);

  // Approve marketplace
  await nft.setApprovalForAll(await marketplace.getAddress(), true, {
    gasLimit: 100_000
  });

  // List NFTs
  await marketplace.listItem(await nft.getAddress(), dogsTokenId, price, { gasLimit: 350_000 });
  await marketplace.listItem(await nft.getAddress(), techTokenId, price, { gasLimit: 350_000 });

  console.log(
    `${seller.address} minted & listed tokens ${dogsTokenId} and ${techTokenId}`
  );

  // --------------------
  // BUYER mints NFTs
  // --------------------
  const yellowTx = await nft.connect(buyer).mint(yellowCrownMetadataUrl);
  const yellowTokenId = await getMintedTokenId(yellowTx);

  const ashleyTx = await nft.connect(buyer).mint(ashleyMetadataUrl);
  const ashleyTokenId = await getMintedTokenId(ashleyTx);

  await nft
    .connect(buyer)
    .setApprovalForAll(await marketplace.getAddress(), true);

  await marketplace
    .connect(buyer)
    .listItem(await nft.getAddress(), yellowTokenId, price);

  console.log(
    `${buyer.address} minted & listed token ${yellowTokenId}`
  );

  await marketplace
    .connect(buyer)
    .listItem(await nft.getAddress(), ashleyTokenId, price);

  console.log(
    `${buyer.address} minted & listed token ${ashleyTokenId}`
  );

  // --------------------
  // BUY actions
  // --------------------
  await marketplace
    .connect(buyer)
    .buyItem(0, {
      value: price, gasLimit: 400_000
    });

  console.log(`${buyer.address} bought dogs NFT`);

  // --------------------
  // RE-LIST after buy
  // --------------------
  await marketplace
    .connect(buyer)
    .listItem(await nft.getAddress(), dogsTokenId, price);

  console.log(`${buyer.address} relisted dogs NFT`);

  console.log("Starting an English Auction...");

  // 1. Mint NFT for Auction
  const auctionTx = await nft.mint(yellowCrownMetadataUrl);
  const auctionTokenId = await getMintedTokenId(auctionTx);

  // 2. Approve Marketplace
  await nft.setApprovalForAll(await marketplace.getAddress(), true);

  // 3. Start Auction: Min Bid 0.01 ETH, Duration 1 day (86400 seconds)
  const duration = 86400;
  await marketplace.startAuction(
    await nft.getAddress(),
    auctionTokenId,
    price,
    duration
  );

  const auctionIndex = 0; // First auction in the array
  console.log(`Auction started for token ${auctionTokenId} by ${seller.address}`);

  // 4. Place a Bid
  const bidAmount = hre.ethers.parseEther("0.02");
  await marketplace.connect(buyer).bid(auctionIndex, { value: bidAmount });
  console.log(`${buyer.address} placed a bid of 0.02 ETH`);

  // 5. Place a Higher Bid (Optional: demonstrate refund)
  const higherBid = hre.ethers.parseEther("0.03");
  await marketplace.connect(bidder2).bid(auctionIndex, { value: higherBid });
  console.log(`${bidder2.address} outbid with 0.03 ETH (Buyer refunded)`);
}
async function main() {
  if (process.env.IS_RUNNING) return;
  await setupMarket();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

module.exports = {
  setupMarket
};
