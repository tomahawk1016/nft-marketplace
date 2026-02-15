// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Marketplace {
    struct Listing {
        address seller;
        uint256 price;
        address nft;
        uint256 tokenId;
    }

    struct Sale {
        address seller;
        address buyer;
        address nft;
        uint256 tokenId;
        uint256 price;
        uint256 timestamp;
    }

    struct Auction {
        address seller;
        address nft;
        uint256 tokenId;
        uint256 minBid;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool active;
    }

    // For Sold History
    Sale[] public sales;
    mapping(address => mapping(uint256 => bool)) public wasSold;

    Listing[] public allListings;
    mapping(address => mapping(uint256 => uint256)) public listingIndex;

    Auction[] public allAuctions;
    mapping(address => mapping(uint256 => uint256)) public auctionIndex;

    mapping(address => uint256) public loyaltyPoints;

    event ItemListed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nft,
        uint256 tokenId,
        uint256 price
    );

    event ItemSold(uint256 indexed listingId, address buyer);

    event ListingCancelled(uint256 indexed listingId);

    event AuctionStarted(
        uint256 indexed auctionId,
        address indexed seller,
        address indexed nft,
        uint256 tokenId,
        uint256 minBid,
        uint256 endTime
    );

    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    event AuctionEnded(
        uint256 indexed auctionId,
        address winner,
        uint256 amount
    );

    event PointsAwarded(address indexed user, uint256 amount);

    function listItem(address nft, uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be > 0");

        IERC721(nft).transferFrom(msg.sender, address(this), tokenId);

        allListings.push(Listing(msg.sender, price, nft, tokenId));
        uint256 index = allListings.length - 1;

        listingIndex[nft][tokenId] = index;

        emit ItemListed(index, msg.sender, nft, tokenId, price);
    }

    function _awardPoints(address user, uint256 amount) internal {
        uint256 points = amount / 1e17; // 10 points per 1 ETH
        if (points > 0) {
            loyaltyPoints[user] += points;
            emit PointsAwarded(user, points);
        }
    }

    function buyItem(uint256 index) external payable {
        Listing memory item = allListings[index];

        require(msg.value == item.price, "Wrong ETH");

        (bool success, ) = payable(item.seller).call{value: msg.value}("");
        require(success, "ETH transfer failed");

        IERC721(item.nft).transferFrom(address(this), msg.sender, item.tokenId);

        // Award points to both buyer and seller
        _awardPoints(item.seller, msg.value);
        _awardPoints(msg.sender, msg.value);

        //STORE SALE
        sales.push(
            Sale(
                item.seller,
                msg.sender,
                item.nft,
                item.tokenId,
                item.price,
                block.timestamp
            )
        );
        //For Sold badges
        wasSold[item.nft][item.tokenId] = true;

        uint256 last = allListings.length - 1;

        if (index != last) {
            Listing memory lastItem = allListings[last];
            allListings[index] = lastItem;
            listingIndex[lastItem.nft][lastItem.tokenId] = index;
        }

        allListings.pop();
        delete listingIndex[item.nft][item.tokenId];

        emit ItemSold(index, msg.sender);
    }

    function cancelListing(uint256 index) external {
        Listing memory item = allListings[index];
        require(item.seller == msg.sender, "Not seller");

        IERC721(item.nft).transferFrom(
            address(this),
            item.seller,
            item.tokenId
        );

        uint256 last = allListings.length - 1;

        if (index != last) {
            Listing memory lastItem = allListings[last];
            allListings[index] = lastItem;
            listingIndex[lastItem.nft][lastItem.tokenId] = index;
        }

        allListings.pop();
        delete listingIndex[item.nft][item.tokenId];

        emit ListingCancelled(index);
    }

    function updatePrice(uint256 index, uint256 newPrice) external {
        require(newPrice > 0, "Price must be > 0");
        require(index < allListings.length, "Invalid index");

        Listing storage item = allListings[index];
        require(item.seller == msg.sender, "Not seller");

        item.price = newPrice;
    }

    function startAuction(
        address nft,
        uint256 tokenId,
        uint256 minBid,
        uint256 duration
    ) external {
        require(minBid > 0, "Min bid must be > 0");
        require(duration > 0, "Duration must be > 0");

        IERC721(nft).transferFrom(msg.sender, address(this), tokenId);

        allAuctions.push(
            Auction({
                seller: msg.sender,
                nft: nft,
                tokenId: tokenId,
                minBid: minBid,
                highestBid: 0,
                highestBidder: address(0),
                endTime: block.timestamp + duration,
                active: true
            })
        );

        auctionIndex[nft][tokenId] = allAuctions.length - 1;
        emit AuctionStarted(
            allAuctions.length - 1,
            msg.sender,
            nft,
            tokenId,
            minBid,
            block.timestamp + duration
        );
    }

    function bid(uint256 index) external payable {
        Auction storage auction = allAuctions[index];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value >= auction.minBid, "Bid below min bid");
        require(msg.value > auction.highestBid, "Bid below highest bid");

        if (auction.highestBidder != address(0)) {
            (bool success, ) = payable(auction.highestBidder).call{
                value: auction.highestBid
            }("");
            require(success, "Refund failed");
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;

        emit BidPlaced(index, msg.sender, msg.value);
    }

    function endAuction(uint256 index) external {
        Auction storage auction = allAuctions[index];
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction still running");

        auction.active = false;

        if (auction.highestBidder != address(0)) {
            // Transfer ETH to seller
            (bool success, ) = payable(auction.seller).call{
                value: auction.highestBid
            }("");
            require(success, "ETH transfer failed");

            // Award points
            _awardPoints(auction.seller, auction.highestBid);
            _awardPoints(auction.highestBidder, auction.highestBid);

            // Transfer NFT to winner
            IERC721(auction.nft).transferFrom(
                address(this),
                auction.highestBidder,
                auction.tokenId
            );

            sales.push(
                Sale(
                    auction.seller,
                    auction.highestBidder,
                    auction.nft,
                    auction.tokenId,
                    auction.highestBid,
                    block.timestamp
                )
            );
            wasSold[auction.nft][auction.tokenId] = true;
        } else {
            // No bids, return NFT to seller
            IERC721(auction.nft).transferFrom(
                address(this),
                auction.seller,
                auction.tokenId
            );
        }

        emit AuctionEnded(index, auction.highestBidder, auction.highestBid);
    }

    function getAllAuctions() external view returns (Auction[] memory) {
        return allAuctions;
    }

    function getAllListings() external view returns (Listing[] memory) {
        return allListings;
    }

    function getSales() external view returns (Sale[] memory) {
        return sales;
    }

    function getLoyaltyPoints(address user) external view returns (uint256) {
        return loyaltyPoints[user];
    }

    function isSold(address nft, uint256 tokenId) external view returns (bool) {
        return wasSold[nft][tokenId];
    }
}
