import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Tag, Eye, Gavel, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { resolveIPFS } from '../lib/ipfs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { useWeb3 } from '../hooks/useWeb3';

export interface NFTItem {
  tokenId: number;
  seller: string;
  price: string;
  nftAddress: string;
  listingId?: number;
  name?: string;
  image?: string;
  description?: string;
  category?: string;
  owner?: string;
  isListed?: boolean;
  // Auction fields
  isAuction?: boolean;
  auctionId?: number;
  minBid?: string;
  highestBid?: string;
  highestBidder?: string;
  endTime?: number;
  auctionActive?: boolean;
}

interface NFTCardProps {
  item: NFTItem;
  onBuy?: (listingId: number, price: string) => Promise<void>;
  onCancel?: (listingId: number) => Promise<void>;
  onBid?: (auctionId: number, amount: string) => Promise<void>;
  isOwner?: boolean;
}

const NFTCard: React.FC<NFTCardProps> = ({ item, onBuy, onCancel, onBid, isOwner }) => {
  const { account, setIsConnectModalOpen } = useWeb3();
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (item.isAuction && item.endTime && item.auctionActive) {
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
  }, [item.isAuction, item.endTime, item.auctionActive]);

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!account) {
      setIsConnectModalOpen(true);
      return;
    }
    if (onBuy && item.listingId !== undefined) {
      onBuy(item.listingId, item.price);
    }
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCancel && item.listingId !== undefined) {
      onCancel(item.listingId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="h-full"
    >
      <Card className="overflow-hidden border-none rounded-[2rem] group bg-card/50 backdrop-blur-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_20px_50px_rgba(255,255,255,0.05)] transition-all duration-500 h-full flex flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]" />

        <Link to={`/nft/${item.nftAddress}/${item.tokenId}`} className="relative flex-shrink-0">
          <div className="relative aspect-square overflow-hidden rounded-[1.8rem] m-2">
            <img
              src={resolveIPFS(item.image || '') || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop'}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />

            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {item.isListed && (
                <Badge className="bg-primary/90 text-white border-none px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg font-bold text-[10px] uppercase tracking-wider">
                  Direct Sale
                </Badge>
              )}
              {item.isAuction && (
                <Badge className="bg-orange-500/90 text-white border-none px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                  <Gavel className="h-3 w-3" />
                  Auction
                </Badge>
              )}
            </div>

            {item.isAuction && item.auctionActive && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md text-white rounded-2xl p-2.5 flex items-center justify-between border border-white/10 shadow-xl">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-orange-400" />
                  <span className="text-xs font-bold font-mono">{timeLeft}</span>
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
            )}

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 duration-300">
              <Button size="icon" variant="secondary" className="rounded-full h-12 w-12 bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40 hover:scale-110 transition-all">
                <Eye className="h-6 w-6" />
              </Button>
              <Button size="icon" variant="secondary" className="rounded-full h-12 w-12 bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40 hover:scale-110 transition-all">
                <Heart className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </Link>

        <CardContent className="p-6 space-y-4 flex-grow flex flex-col relative z-10">
          <div className="space-y-1">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-extrabold text-xl truncate group-hover:text-primary transition-colors">{item.name || `NFT #${item.tokenId}`}</h3>
              <Badge variant="outline" className="font-mono text-[10px] rounded-lg px-2 border-primary/20 text-primary">
                #{item.tokenId}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              by <span className="text-foreground/80 hover:text-primary transition-colors cursor-pointer truncate max-w-[120px] font-bold">
                {item.seller ? `${item.seller.slice(0, 6)}...${item.seller.slice(-4)}` : 'Unnamed Collection'}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 mt-auto">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-70">
                {item.isAuction ? 'Highest Bid' : 'Price'}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight">
                  {item.isAuction
                    ? (item.highestBid && item.highestBid !== '0' ? ethers.formatEther(item.highestBid) : ethers.formatEther(item.minBid || '0'))
                    : (item.price ? ethers.formatEther(item.price) : '---')}
                </span>
                <span className="text-xs font-bold text-primary">ETH</span>
              </div>
            </div>
            {item.category && (
              <div className="space-y-1 text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-70">Category</p>
                <Badge variant="secondary" className="bg-primary/5 text-primary border-none rounded-lg font-bold text-[10px]">
                  {item.category}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0 mt-auto relative z-10">
          {item.isAuction ? (
            <Link to={`/nft/${item.nftAddress}/${item.tokenId}`} className="w-full">
              <Button
                className="w-full rounded-2xl gap-2 h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-lg shadow-lg hover:shadow-orange-500/20 hover:-translate-y-1 transition-all duration-300"
              >
                <Gavel className="h-5 w-5" />
                Place Bid
              </Button>
            </Link>
          ) : item.isListed ? (
            isOwner ? (
              <Button
                variant="destructive"
                className="w-full rounded-2xl gap-2 h-14 font-bold text-lg hover:-translate-y-1 transition-all duration-300 shadow-lg"
                onClick={handleCancelClick}
              >
                Cancel Listing
              </Button>
            ) : (
              <Button
                className="w-full rounded-2xl gap-2 h-14 bg-primary text-white font-bold text-lg shadow-lg hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300"
                onClick={handleBuyClick}
              >
                <ShoppingCart className="h-4 w-4" />
                Buy Now
              </Button>
            )
          ) : isOwner ? (
            <Link to={`/nft/${item.nftAddress}/${item.tokenId}`} className="w-full">
              <Button variant="secondary" className="w-full rounded-2xl gap-2 h-14 font-bold text-lg border-2 border-primary/10 hover:border-primary/30 transition-all duration-300">
                <Tag className="h-5 w-5" />
                Manage NFT
              </Button>
            </Link>
          ) : (
            <Button disabled className="w-full rounded-2xl h-14 opacity-50 font-bold text-lg">
              Not for Sale
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default NFTCard;
