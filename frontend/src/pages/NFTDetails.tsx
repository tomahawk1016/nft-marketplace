import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Tag, Share2, MoreHorizontal, ExternalLink, History, Info, ShieldCheck, Loader2, ArrowLeft, Gavel, Clock, Trophy, TrendingUp, AlertCircle, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import { useWeb3 } from '../hooks/useWeb3';
import { resolveIPFS } from '../lib/ipfs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'react-hot-toast';

const NFTDetails: React.FC = () => {
  const { nftAddress, tokenId } = useParams();
  const { account, nftContract, marketplaceContract, connect, setIsConnectModalOpen, refreshLoyaltyPoints } = useWeb3();
  const navigate = useNavigate();

  const [item, setItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [listPrice, setListPrice] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [auctionDuration, setDuration] = useState('86400'); // Default 1 day
  const [minBid, setMinBid] = useState('');
  const [timeLeft, setTimeLeft] = useState<string>('');

  const fetchNFTDetails = async () => {
    if (!nftContract || !marketplaceContract || !tokenId) return;

    try {
      setIsLoading(true);
      const tokenURI = await nftContract.tokenURI(tokenId);
      const owner = await nftContract.ownerOf(tokenId);
      const resolvedURI = resolveIPFS(tokenURI);

      let metadata = { name: `NFT #${tokenId}`, image: '', description: '', category: '' };
      try {
        const response = await fetch(resolvedURI);
        metadata = await response.json();
      } catch (e) {
        console.error('Error fetching metadata:', e);
      }

      // Check if listed
      const listings = await marketplaceContract.getAllListings();
      const listingIndex = listings.findIndex((l: any) => l.nft.toLowerCase() === nftAddress?.toLowerCase() && l.tokenId.toString() === tokenId);

      const listing = listingIndex !== -1 ? listings[listingIndex] : null;

      // Check for auctions
      const auctions = await marketplaceContract.getAllAuctions();
      const auctionIndex = auctions.findIndex((a: any) => a.nft.toLowerCase() === nftAddress?.toLowerCase() && a.tokenId.toString() === tokenId && a.active);
      const auction = auctionIndex !== -1 ? auctions[auctionIndex] : null;

      setItem({
        tokenId: Number(tokenId),
        nftAddress,
        owner,
        name: metadata.name,
        image: metadata.image,
        description: metadata.description,
        category: metadata.category,
        isListed: !!listing,
        listingId: listingIndex !== -1 ? listingIndex : null,
        price: listing ? listing.price.toString() : '0',
        seller: listing ? listing.seller : null,
        isAuction: !!auction,
        auctionId: auctionIndex !== -1 ? auctionIndex : null,
        minBid: auction ? auction.minBid.toString() : '0',
        highestBid: auction ? auction.highestBid.toString() : '0',
        highestBidder: auction ? auction.highestBidder : null,
        endTime: auction ? Number(auction.endTime) : 0,
        auctionActive: auction ? auction.active : false
      });
    } catch (error) {
      console.error('Error fetching NFT details:', error);
      toast.error('Failed to load NFT details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTDetails();
  }, [nftContract, marketplaceContract, tokenId, nftAddress]);

  useEffect(() => {
    if (item?.isAuction && item?.endTime && item?.auctionActive) {
      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const distance = Number(item.endTime) - now;

        if (distance < 0) {
          setTimeLeft('Ended');
          clearInterval(interval);
        } else {
          const days = Math.floor(distance / (24 * 3600));
          const hours = Math.floor((distance % (24 * 3600)) / 3600);
          const minutes = Math.floor((distance % 3600) / 60);
          const seconds = distance % 60;

          if (days > 0) {
            setTimeLeft(`${days}d ${hours}h ${minutes}m`);
          } else {
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [item?.isAuction, item?.endTime, item?.auctionActive]);


  const handleBuy = async () => {
    if (!account) {
      setIsConnectModalOpen(true);
      return;
    }

    try {
      setIsProcessing(true);
      const tx = await marketplaceContract?.buyItem(item.listingId, { value: item.price });
      toast.loading('Processing purchase...', { id: 'buy' });
      await tx.wait();

      const pointsEarned = Math.floor(parseFloat(ethers.formatEther(item.price)) * 10);

      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-bold">Purchase Successful!</p>
          {pointsEarned > 0 && (
            <div className="flex items-center gap-2 text-amber-500 font-extrabold text-xs">
              <Award className="h-4 w-4" />
              + {pointsEarned} LOYALTY POINTS EARNED
            </div>
          )}
        </div>,
        { id: 'buy', duration: 5000 }
      );

      await refreshLoyaltyPoints();
      fetchNFTDetails();
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.reason || 'Purchase failed', { id: 'buy' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleList = async () => {
    if (!account) {
      setIsConnectModalOpen(true);
      return;
    }

    if (!listPrice || isNaN(Number(listPrice)) || Number(listPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setIsProcessing(true);
      toast.loading('Approving marketplace...', { id: 'list' });

      // 1. Approve Marketplace
      const marketplaceAddr = await marketplaceContract?.getAddress();
      const isApproved = await nftContract?.isApprovedForAll(account, marketplaceAddr);

      if (!isApproved) {
        const approveTx = await nftContract?.setApprovalForAll(marketplaceAddr, true);
        await approveTx.wait();
      }

      toast.loading('Listing NFT...', { id: 'list' });

      // 2. List Item
      const priceWei = ethers.parseEther(listPrice);
      const listTx = await marketplaceContract?.listItem(nftAddress, tokenId, priceWei);
      await listTx.wait();

      toast.success('NFT listed successfully!', { id: 'list' });
      fetchNFTDetails();
    } catch (error: any) {
      console.error('Listing error:', error);
      toast.error(error.reason || 'Listing failed', { id: 'list' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartAuction = async () => {
    if (!account) { setIsConnectModalOpen(true); return; }
    if (!minBid || isNaN(Number(minBid)) || Number(minBid) <= 0) { toast.error('Enter a valid minimum bid'); return; }
    try {
      setIsProcessing(true);
      const marketplaceAddr = await marketplaceContract?.getAddress();
      const isApproved = await nftContract?.isApprovedForAll(account, marketplaceAddr);
      if (!isApproved) {
        const approveTx = await nftContract?.setApprovalForAll(marketplaceAddr, true);
        await approveTx.wait();
      }
      const bidWei = ethers.parseEther(minBid);
      const tx = await marketplaceContract?.startAuction(nftAddress, tokenId, bidWei, auctionDuration);
      await tx.wait();
      toast.success('Auction started successfully!');
      fetchNFTDetails();
    } catch (error: any) { toast.error(error.reason || 'Auction failed'); }
    finally { setIsProcessing(false); }
  };

  const handleBid = async () => {
    if (!account) { setIsConnectModalOpen(true); return; }
    if (!bidAmount || isNaN(Number(bidAmount))) { toast.error('Enter a valid bid amount'); return; }

    const currentPrice = item.highestBid !== '0' ? item.highestBid : item.minBid;
    if (ethers.parseEther(bidAmount) <= BigInt(currentPrice)) {
      toast.error('Bid must be higher than current price');
      return;
    }

    try {
      setIsProcessing(true);
      const tx = await marketplaceContract?.bid(item.auctionId, { value: ethers.parseEther(bidAmount) });
      toast.loading('Placing bid...', { id: 'bid' });
      await tx.wait();
      toast.success('Bid placed successfully!', { id: 'bid' });
      fetchNFTDetails();
    } catch (error: any) { toast.error(error.reason || 'Bidding failed', { id: 'bid' }); }
    finally { setIsProcessing(false); }
  };

  const handleEndAuction = async () => {
    try {
      setIsProcessing(true);
      const tx = await marketplaceContract?.endAuction(item.auctionId);
      toast.loading('Ending auction...', { id: 'end' });
      await tx.wait();

      const finalPrice = item.highestBid !== '0' ? item.highestBid : '0';
      const pointsEarned = Math.floor(parseFloat(ethers.formatEther(finalPrice)) * 10);

      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-bold">Auction finalized!</p>
          {pointsEarned > 0 && (
            <div className="flex items-center gap-2 text-amber-500 font-extrabold text-xs">
              <Award className="h-4 w-4" />
              Loyalty Points Updated
            </div>
          )}
        </div>,
        { id: 'end', duration: 5000 }
      );

      await refreshLoyaltyPoints();
      fetchNFTDetails();
    } catch (error: any) { toast.error(error.reason || 'Failed to end auction', { id: 'end' }); }
    finally { setIsProcessing(false); }
  };

  const handleCancel = async () => {
    if (!account) return;

    try {
      setIsProcessing(true);
      const tx = await marketplaceContract?.cancelListing(item.listingId);
      toast.loading('Canceling listing...', { id: 'cancel' });
      await tx.wait();
      toast.success('Listing canceled!', { id: 'cancel' });
      fetchNFTDetails();
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast.error(error.reason || 'Cancel failed', { id: 'cancel' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };


  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse">Loading NFT details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold mb-4">NFT not found</h2>
        <Button onClick={() => navigate('/explore')}>Back to Explore</Button>
      </div>
    );
  }

  const isOwner = account?.toLowerCase() === item.owner?.toLowerCase() || account?.toLowerCase() === item.seller?.toLowerCase();
  const isSeller = account?.toLowerCase() === item.seller?.toLowerCase();
  const auctionHasEnded = item.isAuction && Math.floor(Date.now() / 1000) > item.endTime;

  return (
    <div className="container mx-auto px-4 py-12 pb-24">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 gap-3 hover:bg-secondary rounded-2xl h-12 border-2 border-primary/5 font-bold">
        <ArrowLeft className="h-5 w-5" />
        Back
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Column: Image */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-primary/5 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
            <Card className="overflow-hidden rounded-[2.5rem] border-none shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_80px_-20px_rgba(255,255,255,0.05)] relative z-10">
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={resolveIPFS(item.image) || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop'}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                {item.isAuction && item.auctionActive && (
                  <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-[1.5rem] text-white flex items-center gap-3 shadow-2xl animate-bounce-subtle">
                    <Clock className="h-5 w-5 text-orange-400" />
                    <span className="font-black font-mono text-lg">{timeLeft}</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          <Card className="rounded-[2rem] border border-primary/5 bg-card/50 backdrop-blur-md p-8 space-y-6">
            <h3 className="font-black text-xl flex items-center gap-3">
              <Info className="h-6 w-6 text-primary" />
              Description
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed font-medium">
              {item.description || 'No description provided for this NFT. It belongs to an exclusive collection of digital assets.'}
            </p>
          </Card>

          <Card className="rounded-[2rem] border border-primary/5 bg-card/50 backdrop-blur-md p-8 space-y-6">
            <h3 className="font-black text-xl flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Contract Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center group cursor-pointer p-2 rounded-xl hover:bg-primary/5 transition-all" onClick={() => window.open(`https://sepolia.etherscan.io/address/${item.nftAddress}`, '_blank')}>
                <span className="text-muted-foreground font-bold">Contract Address</span>
                <span className="font-mono text-primary font-bold group-hover:underline flex items-center gap-2">
                  {item.nftAddress.slice(0, 10)}...{item.nftAddress.slice(-4)}
                  <ExternalLink className="h-3 w-3" />
                </span>
              </div>
              <div className="flex justify-between items-center p-2">
                <span className="text-muted-foreground font-bold">Token ID</span>
                <span className="font-black text-lg">{item.tokenId}</span>
              </div>
              <div className="flex justify-between items-center p-2">
                <span className="text-muted-foreground font-bold">Token Standard</span>
                <span className="font-black text-lg">ERC-721</span>
              </div>
              <div className="flex justify-between items-center p-2">
                <span className="text-muted-foreground font-bold">Blockchain</span>
                <Badge variant="secondary" className="bg-primary/5 text-primary border-none px-4 py-1 font-black">Ethereum Sepolia</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Info & Actions */}
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link to="/explore" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary/5 text-primary font-black hover:bg-primary/10 transition-all border border-primary/5">
                <TrendingUp className="h-4 w-4" />
                Trending Collection
              </Link>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-2 border-primary/5 hover:border-primary/20 hover:bg-secondary transition-all shadow-lg" onClick={handleShare}>
                  <Share2 className="h-6 w-6" />
                </Button>
                <div className="relative">
                  <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-2 border-primary/5 hover:border-primary/20 hover:bg-secondary transition-all shadow-lg" onClick={() => setShowMoreOptions(!showMoreOptions)} >
                    <MoreHorizontal className="h-6 w-6" />
                  </Button>
                  {showMoreOptions && (
                    <div className="absolute right-0 top-12 bg-background border rounded-xl shadow-xl p-2 w-48 z-10">
                      <button className="w-full text-left px-4 py-2 hover:bg-secondary rounded-lg text-sm" onClick={() => { toast.success('Metadata refreshed'); setShowMoreOptions(false); }}>
                        Refresh Metadata
                      </button>
                      <button className="w-full text-left px-4 py-2 hover:bg-secondary rounded-lg text-sm text-red-500" onClick={() => { toast.success('Reported'); setShowMoreOptions(false); }}>
                        Report Item
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">{item.name || `NFT #${item.tokenId}`}</h1>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-3 p-2 pr-6 rounded-2xl bg-secondary/50 backdrop-blur-sm border border-white/5">
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-primary/10 border-2 border-white shadow-lg">
                  <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${item.seller || item.owner}`} alt="Creator" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-70">Owner</span>
                  <span className="text-primary font-bold">{isOwner ? 'You' : `${item.owner.slice(0, 6)}...${item.owner.slice(-4)}`}</span>
                </div>
              </div>
              {item.category && (
                <div className="px-6 py-3 rounded-2xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/20">
                  {item.category}
                </div>
              )}
            </div>
          </div>


          <Card className="rounded-[2.5rem] border-none bg-gradient-to-br from-card to-card/80 backdrop-blur-xl p-10 space-y-8 shadow-2xl relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Gavel className="h-32 w-32" />
            </div>

            {item.isAuction ? (
              <div className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">Current Bid</p>
                    <div className="flex items-end gap-3">
                      <span className="text-5xl font-black tracking-tighter">
                        {item.highestBid !== '0' ? ethers.formatEther(item.highestBid) : ethers.formatEther(item.minBid)}
                      </span>
                      <span className="text-2xl font-bold text-primary mb-1">ETH</span>
                    </div>
                    {item.highestBidder !== ethers.ZeroAddress && (
                      <p className="text-xs font-bold text-muted-foreground flex items-center gap-2 pt-2">
                        <Trophy className="h-3 w-3 text-orange-400" />
                        Highest bidder: <span className="text-foreground">{item.highestBidder?.slice(0, 6)}...</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">Time Remaining</p>
                    <div className="text-4xl font-black font-mono text-orange-500 bg-orange-500/5 px-4 py-2 rounded-2xl border border-orange-500/10 w-fit">
                      {timeLeft}
                    </div>
                  </div>
                </div>

                {!auctionHasEnded ? (
                  <div className="space-y-4">
                    {!isSeller ? (
                      <div className="flex flex-col gap-4">
                        <div className="relative group">
                          <Gavel className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            type="number"
                            placeholder="Enter bid amount..."
                            className="h-16 pl-14 rounded-2xl bg-primary/5 border-2 border-transparent focus:border-primary transition-all text-xl font-bold"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                          />
                        </div>
                        <Button
                          className="w-full h-20 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black text-2xl shadow-2xl shadow-orange-500/30 hover:-translate-y-1.5 transition-all duration-300 gap-4"
                          onClick={handleBid}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                            <>
                              <Gavel className="h-8 w-8" />
                              Place Bid Now
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-blue-500 flex items-center gap-4">
                        <AlertCircle className="h-6 w-6" />
                        <p className="font-bold">This is your auction. You'll be able to finalize it once it ends.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20 text-orange-500 flex items-center gap-4">
                      <AlertCircle className="h-6 w-6" />
                      <p className="font-black text-lg">Auction has ended!</p>
                    </div>
                    {item.auctionActive && (
                      <Button
                        className="w-full h-20 rounded-2xl bg-primary text-white font-black text-2xl shadow-2xl shadow-primary/20 hover:-translate-y-1.5 transition-all"
                        onClick={handleEndAuction}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : 'Finalize & Settle Auction'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : item.isListed ? (
              <div className="space-y-8 relative z-10">
                <div className="space-y-2">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">Direct Sale Price</p>
                  <div className="flex items-end gap-3">
                    <span className="text-6xl font-black tracking-tighter">{ethers.formatEther(item.price)}</span>
                    <span className="text-3xl font-bold text-primary mb-1.5">ETH</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-500 pt-2">
                    <Award className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-widest">+ {Math.floor(parseFloat(ethers.formatEther(item.price)) * 10)} Loyalty Points on purchase</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                  {isSeller ? (
                    <Button
                      variant="destructive"
                      className="flex-1 h-20 rounded-2xl font-black text-xl shadow-2xl shadow-red-500/20 hover:-translate-y-1.5 transition-all"
                      onClick={handleCancel}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : 'Cancel Listing'}
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 h-20 rounded-2xl bg-primary text-white font-black text-2xl shadow-2xl shadow-primary/20 hover:-translate-y-1.5 transition-all gap-4"
                      onClick={handleBuy}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                        <>
                          <ShoppingCart className="h-8 w-8" />
                          Buy Now
                        </>
                      )}
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => navigate(-1)} className="flex-1 h-20 rounded-2xl border-4 font-black text-xl hover:bg-secondary transition-all">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 relative z-10">
                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-center gap-4 text-primary">
                  <Tag className="h-8 w-8" />
                  <span className="font-black text-xl text-foreground">Not listed for sale.</span>
                </div>

                {isOwner && (
                  <Tabs defaultValue="list" className="w-full">
                    <TabsList className="grid grid-cols-2 bg-secondary/50 p-1.5 rounded-2xl h-auto mb-8">
                      <TabsTrigger value="list" className="rounded-xl py-4 font-black data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all">Direct Sale</TabsTrigger>
                      <TabsTrigger value="auction" className="rounded-xl py-4 font-black data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all">Auction</TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="price" className="font-black text-sm uppercase tracking-widest text-muted-foreground ml-1">Fixed Price (ETH)</Label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="0.05"
                          className="h-16 rounded-2xl bg-primary/5 border-2 border-transparent focus:border-primary transition-all text-xl font-bold"
                          value={listPrice}
                          onChange={(e) => setListPrice(e.target.value)}
                        />
                      </div>
                      <Button
                        className="w-full h-20 rounded-2xl bg-primary text-white font-black text-2xl shadow-2xl shadow-primary/20 hover:-translate-y-1.5 transition-all"
                        onClick={handleList}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : 'List for Sale'}
                      </Button>
                    </TabsContent>

                    <TabsContent value="auction" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="font-black text-sm uppercase tracking-widest text-muted-foreground ml-1">Starting Bid (ETH)</Label>
                          <Input
                            type="number"
                            placeholder="0.01"
                            className="h-16 rounded-2xl bg-primary/5 border-2 border-transparent focus:border-primary transition-all text-xl font-bold"
                            value={minBid}
                            onChange={(e) => setMinBid(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="font-black text-sm uppercase tracking-widest text-muted-foreground ml-1">Duration</Label>
                          <select
                            className="w-full h-16 rounded-2xl bg-primary/5 border-2 border-transparent focus:border-primary transition-all text-lg font-bold px-4 outline-none"
                            value={auctionDuration}
                            onChange={(e) => setDuration(e.target.value)}
                          >
                            <option value="3600">1 Hour</option>
                            <option value="86400">1 Day</option>
                            <option value="259200">3 Days</option>
                            <option value="604800">1 Week</option>
                          </select>
                        </div>
                      </div>
                      <Button
                        className="w-full h-20 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black text-2xl shadow-2xl shadow-orange-500/30 hover:-translate-y-1.5 transition-all"
                        onClick={handleStartAuction}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : 'Start Auction'}
                      </Button>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            )}
          </Card>

          <Tabs defaultValue="history" className="w-full">
            <TabsList className="bg-transparent border-b w-full justify-start h-auto p-0 gap-8 rounded-none border-primary/5">
              <TabsTrigger
                value="history"
                className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-4 border-transparent rounded-none px-4 pb-4 h-auto font-black text-lg transition-all"
              >
                <History className="h-5 w-5 mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-4 border-transparent rounded-none px-4 pb-4 h-auto font-black text-lg transition-all"
              >
                <Info className="h-5 w-5 mr-2" />
                Attributes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="pt-8">
              <Card className="rounded-3xl border border-primary/5 bg-secondary/20 p-12 text-center text-muted-foreground font-bold">
                No trading history found for this NFT yet.
              </Card>
            </TabsContent>

            <TabsContent value="details" className="pt-8">
              <Card className="rounded-3xl border border-primary/5 bg-secondary/20 p-12 text-center text-muted-foreground font-bold">
                No custom attributes available for this item.
              </Card>
            </TabsContent>
          </Tabs>
        </div >
      </div >
    </div>
  );
};

export default NFTDetails;
