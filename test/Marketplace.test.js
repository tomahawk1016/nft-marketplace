const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT + Marketplace", function () {
  let nft, marketplace;
  let deployer, seller, buyer;

  const URI = "ipfs://test-uri";
  const PRICE = ethers.parseEther("1");

  beforeEach(async () => {
    [deployer, seller, buyer] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy();
    await nft.waitForDeployment();

    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy();
    await marketplace.waitForDeployment();
  });

  it("mints NFT with correct owner and tokenURI", async () => {
    await nft.connect(seller).mint(URI);

    expect(await nft.ownerOf(1)).to.equal(seller.address);
    expect(await nft.tokenURI(1)).to.equal(URI);
  });

  it("lists NFT on marketplace", async () => {
    await nft.connect(seller).mint(URI);

    await nft
      .connect(seller)
      .approve(await marketplace.getAddress(), 1);

    await marketplace.connect(seller).listItem(
      await nft.getAddress(),
      1,
      PRICE
    );

    const listing = await marketplace.allListings(0);

    expect(listing.seller).to.equal(seller.address);
    expect(listing.price.toString()).to.equal(PRICE.toString());
    expect(Number(listing.tokenId)).to.equal(1);
  });

  it("allows buyer to purchase NFT", async () => {
    await nft.connect(seller).mint(URI);

    await nft
      .connect(seller)
      .approve(await marketplace.getAddress(), 1);

    await marketplace.connect(seller).listItem(
      await nft.getAddress(),
      1,
      PRICE
    );

    await marketplace.connect(buyer).buyItem(0, {
      value: PRICE,
    });

    expect(await nft.ownerOf(1)).to.equal(buyer.address);
  });

  it("reverts if wrong ETH amount sent", async () => {
    await nft.connect(seller).mint(URI);

    await nft
      .connect(seller)
      .approve(await marketplace.getAddress(), 1);

    await marketplace.connect(seller).listItem(
      await nft.getAddress(),
      1,
      PRICE
    );

    await expect(
      marketplace.connect(buyer).buyItem(0, {
        value: ethers.parseEther("0.5"),
      })
    ).to.be.revertedWith("Wrong ETH");
  });

  it("allows seller to cancel listing", async () => {
    await nft.connect(seller).mint(URI);

    await nft
      .connect(seller)
      .approve(await marketplace.getAddress(), 1);

    await marketplace.connect(seller).listItem(
      await nft.getAddress(),
      1,
      PRICE
    );

    await marketplace.connect(seller).cancelListing(0);

    expect(await nft.ownerOf(1)).to.equal(seller.address);
  });

  it("reverts cancel if not seller", async () => {
    await nft.connect(seller).mint(URI);

    await nft
      .connect(seller)
      .approve(await marketplace.getAddress(), 1);

    await marketplace.connect(seller).listItem(
      await nft.getAddress(),
      1,
      PRICE
    );

    await expect(
      marketplace.connect(buyer).cancelListing(0)
    ).to.be.revertedWith("Not seller");
  });

  it("reverts if listing price is zero", async () => {
    await nft.connect(seller).mint(URI);

    await nft
      .connect(seller)
      .approve(await marketplace.getAddress(), 1);

    await expect(
      marketplace.connect(seller).listItem(
        await nft.getAddress(),
        1,
        0
      )
    ).to.be.revertedWith("Price must be > 0");
  });

  describe("Loyalty System", function () {
    it("should award points to both buyer and seller after a sale", async () => {
      await nft.connect(seller).mint(URI);
      await nft.connect(seller).approve(await marketplace.getAddress(), 1);
      await marketplace.connect(seller).listItem(await nft.getAddress(), 1, PRICE);

      // Buy the item
      await marketplace.connect(buyer).buyItem(0, { value: PRICE });

      // Calculate expected points: 1 ETH / 1e17 = 10 points
      const expectedPoints = 10;

      expect(await marketplace.getLoyaltyPoints(seller.address)).to.equal(expectedPoints);
      expect(await marketplace.getLoyaltyPoints(buyer.address)).to.equal(expectedPoints);
    });

    it("should award points after a successful auction", async () => {
      await nft.connect(seller).mint(URI);
      await nft.connect(seller).approve(await marketplace.getAddress(), 1);

      const duration = 3600;
      const bidAmount = ethers.parseEther("2.0");

      await marketplace.connect(seller).startAuction(await nft.getAddress(), 1, PRICE, duration);
      await marketplace.connect(buyer).bid(0, { value: bidAmount });

      // Fast forward time and end auction
      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine");

      await marketplace.endAuction(0);

      // 2.0 ETH / 1e17 = 20 points
      const expectedPoints = 20;

      expect(await marketplace.getLoyaltyPoints(seller.address)).to.equal(expectedPoints);
      expect(await marketplace.getLoyaltyPoints(buyer.address)).to.equal(expectedPoints);
    });
  });


  it("should successfully run an auction", async () => {
    await nft.connect(seller).mint(URI);
    await nft.connect(seller).approve(await marketplace.getAddress(), 1);

    const duration = 3600; // 1 hour
    await marketplace.connect(seller).startAuction(await nft.getAddress(), 1, PRICE, duration);

    await marketplace.connect(buyer).bid(0, { value: ethers.parseEther("1.5") });

    // Fast forward time
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine");

    await marketplace.endAuction(0);
    expect(await nft.ownerOf(1)).to.equal(buyer.address);
  });

  it("should refund the previous bidder", async () => {
    await nft.connect(seller).mint(URI);
    await nft.connect(seller).approve(await marketplace.getAddress(), 1);
    await marketplace.connect(seller).startAuction(await nft.getAddress(), 1, PRICE, 3600);

    await marketplace.connect(buyer).bid(0, { value: ethers.parseEther("1.5") });

    const secondBuyer = (await ethers.getSigners())[3];
    const initialBalance = await ethers.provider.getBalance(buyer.address);

    await marketplace.connect(secondBuyer).bid(0, { value: ethers.parseEther("2.0") });

    const finalBalance = await ethers.provider.getBalance(buyer.address);
    expect(finalBalance).to.be.gt(initialBalance);
  });
});

