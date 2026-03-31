import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search, RefreshCw, Gavel, Tag, Sparkles, Award, Wallet, ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';
import { resolveIPFS } from '../lib/ipfs';
import NFTGrid from '../components/NFTGrid';
import { NFTItem } from '../components/NFTCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'react-hot-toast';
import { Grid } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const Explore: React.FC = () => {
  const { marketplaceContract, nftContract, account, setIsConnectModalOpen, refreshLoyaltyPoints, loyaltyPoints } = useWeb3();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<NFTItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<NFTItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("recent");

  // Filter states
  const [statusFilters, setStatusFilters] = useState({ buyNow: true, onAuction: true, isNew: true });
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [chainFilters, setChainFilters] = useState({ sepolia: true, localhost: false });

  const loadListings = async () => {
    if (!marketplaceContract || !nftContract) return;

    try {
      setIsLoading(true);
      //Fetch Direct Listings
      const listings = await marketplaceContract.getAllListings();

      const formattedItems = await Promise.all(
        listings.map(async (listing: any, index: number) => {
          try {
            const tokenURI = await nftContract.tokenURI(listing.tokenId);
            const resolvedURI = resolveIPFS(tokenURI);

            let metadata = { name: `NFT #${listing.tokenId}`, image: '', description: '', category: '' };
            try {
              const response = await fetch(resolvedURI);
              metadata = await response.json();
            } catch (e) {
              console.error('Error fetching metadata:', e);
            }

            return {
              listingId: index,
              tokenId: Number(listing.tokenId),
              seller: listing.seller,
              price: listing.price.toString(),
              nftAddress: listing.nft,
              name: metadata.name,
              image: metadata.image,
              description: metadata.description,
              category: metadata.category,
              isListed: true,
              isAuction: false
            };
          } catch (e) {
            console.error(`Error processing listing ${index}:`, e);
            return null;
          }
        })
      );

      //Fetch Auctions
      const auctions = await marketplaceContract.getAllAuctions();
      const formattedAuctions = await Promise.all(
        auctions.map(async (auction: any, index: number) => {
          if (!auction.active) return null;

          try {
            const tokenURI = await nftContract.tokenURI(auction.tokenId);
            const resolvedURI = resolveIPFS(tokenURI);

            let metadata = { name: `NFT #${auction.tokenId}`, image: '', description: '', category: '' };
            try {
              const response = await fetch(resolvedURI);
              metadata = await response.json();
            } catch (e) {
              console.error('Error fetching metadata:', e);
            }

            return {
              auctionId: index,
              tokenId: Number(auction.tokenId),
              seller: auction.seller,
              price: '0',
              nftAddress: auction.nft,
              name: metadata.name,
              image: metadata.image,
              description: metadata.description,
              category: metadata.category,
              isListed: false,
              isAuction: true,
              minBid: auction.minBid.toString(),
              highestBid: auction.highestBid.toString(),
              highestBidder: auction.highestBidder,
              endTime: Number(auction.endTime),
              auctionActive: auction.active
            };
          } catch (e) {
            return null;
          }
        })
      );

      const allItems = [
        ...formattedItems.filter((item): item is NFTItem => item !== null),
        ...formattedAuctions.filter((item): item is NFTItem => item !== null)
      ];

      setItems(allItems);
      setFilteredItems(allItems);
    } catch (error) {
      console.error('Error loading listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!account) {
      setIsLoading(false);
      return;
    }
  }, [])

  useEffect(() => {
    loadListings();
  }, [marketplaceContract, nftContract]);

  useEffect(() => {
    const query = searchParams.get('search')?.toLowerCase() || '';
    const category = searchParams.get('category')?.toLowerCase() || '';
    setSearchQuery(query);

    let filtered = [...items];

    // Search Query
    if (query) {
      filtered = filtered.filter(
        item =>
          item.name?.toLowerCase().includes(query) ||
          ethers.formatEther(item.price).includes(query) ||
          item.tokenId.toString() === query ||
          item.seller.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query)
      );
    }

    // Category Filter
    if (category) {
      filtered = filtered.filter(
        item => item.category?.toLowerCase() === category
      );
    }

    // Status Filter
    filtered = filtered.filter(item => {
      if (statusFilters.buyNow && item.isListed) return true;
      if (statusFilters.onAuction && item.isAuction) return true;
      if (statusFilters.isNew && false) return true; // No new data
      return false;
    });

    const isAnyStatusChecked = statusFilters.buyNow || statusFilters.onAuction || statusFilters.isNew;
    if (!isAnyStatusChecked) {
    }

    // Price Range Filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(item => {
        const itemPrice = item.isAuction
          ? (item.highestBid !== '0' ? item.highestBid : item.minBid)
          : item.price;
        const price = parseFloat(ethers.formatEther(item.price || '0'));
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Chain Filter
    if (!chainFilters.sepolia && !chainFilters.localhost) {
      filtered = [];
    }

    // Sorting
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => {
          const priceA = BigInt(a.isAuction ? (a.highestBid !== '0' ? a.highestBid! : a.minBid!) : a.price);
          const priceB = BigInt(b.isAuction ? (b.highestBid !== '0' ? b.highestBid! : b.minBid!) : b.price);
          return priceA < priceB ? -1 : priceA > priceB ? 1 : 0;
        });
        break;
      case 'price_desc':
        filtered.sort((a, b) => {
          const priceA = BigInt(a.isAuction ? (a.highestBid !== '0' ? a.highestBid! : a.minBid!) : a.price);
          const priceB = BigInt(b.isAuction ? (b.highestBid !== '0' ? b.highestBid! : b.minBid!) : b.price);
          return priceA > priceB ? -1 : priceA < priceB ? 1 : 0;
        });
        break;
      case 'recent':
      default:
        // Mix of listingId and auctionId for stable sort
        filtered.sort((a, b) => {
          const idA = a.isAuction ? a.auctionId! : a.listingId!;
          const idB = b.isAuction ? b.auctionId! : b.listingId!;
          return idB - idA;
        });
        break;
    }

    setFilteredItems(filtered);
  }, [searchParams, items, sortBy, statusFilters, priceRange]);

  const handleBuy = async (listingId: number, price: string) => {
    if (!account) {
      setIsConnectModalOpen(true);
      return;
    }

    try {
      const tx = await marketplaceContract?.buyItem(listingId, { value: price });
      toast.loading('Processing purchase...', { id: 'buy' });
      await tx.wait();

      // 2. Calculate points for UI feedback (10 points per 1 ETH)
      const pointsEarned = Math.floor(parseFloat(ethers.formatEther(price)) * 10);

      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-bold">Purchase Successful!</p>
          {pointsEarned > 0 && (
            <div className="flex items-center gap-2 text-amber-500 font-extrabold text-xs animate-bounce mt-1">
              <Award className="h-4 w-4" />
              + {pointsEarned} LOYALTY POINTS EARNED
            </div>
          )}
        </div>,
        { id: 'buy', duration: 6000 }
      );

      // 3. CRITICAL: Refresh the points in the global state
      await refreshLoyaltyPoints();
      loadListings();
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.reason || 'Purchase failed', { id: 'buy' });
    }
  };

  const handleCancel = async (listingId: number) => {
    if (!marketplaceContract || !account) return;

    try {
      const tx = await marketplaceContract.cancelListing(listingId);
      toast.loading('Canceling listing...', { id: 'cancel' });
      await tx.wait();
      toast.success('Listing canceled!', { id: 'cancel' });
      loadListings();
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast.error(error.reason || 'Cancel failed', { id: 'cancel' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-12 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="space-y-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-2xl bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/5"
          >
            <Sparkles className="h-4 w-4 fill-primary/20" />
            <span>Marketplace Directory</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9]"
          >
            Explore <span className="text-primary">Digital</span> Rareness
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-xl md:text-2xl font-medium leading-relaxed max-w-xl"
          >
            Buy, bid, and trade unique digital assets with our integrated loyalty reward system.
          </motion.p>
        </div>
        <div className="flex items-center gap-4">
          <p className='font-black text-lg'>Refresh</p>
          <Button
            variant="outline"
            onClick={loadListings}
            className="h-10 w-10 rounded-xl border-2 flex items-center justify-center hover:bg-secondary transition-all shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </Button>
          <Button
            variant="outline"
            className={`h-16 px-8 rounded-3xl border-2 gap-3 font-black text-sm uppercase tracking-widest lg:hidden ${showFilters ? 'bg-primary text-white border-primary' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-5 w-5" />
            Filter
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <aside className={`w-full lg:w-80 space-y-10 shrink-0 ${showFilters ? 'block' : 'hidden'} lg:block sticky top-24 h-fit`}>

          {/* NEW: LOYALTY POINTS DISPLAY CARD */}
          {account && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-[2.5rem] bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden"
            >
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Your Balance</p>
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-white" />
                  <span className="text-4xl font-black">{loyaltyPoints}</span>
                  <span className="text-xs font-bold opacity-80">POINTS</span>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-20 transform rotate-12">
                <Sparkles className="h-24 w-24" />
              </div>
            </motion.div>
          )}

          <div className="space-y-10 p-10 rounded-[3rem] bg-card/40 backdrop-blur-xl border border-primary/5 shadow-2xl">
            <div className="space-y-6">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] text-muted-foreground">Market Status</h3>
              <div className="space-y-4">
                {[
                  {
                    label: 'Buy Now',
                    icon: <Tag className="h-4 w-4" />,
                    key: 'buyNow',
                    // Use full strings so Tailwind can detect them
                    activeClass: 'bg-primary border-primary'
                  },
                  {
                    label: 'Auctions',
                    icon: <Gavel className="h-4 w-4" />,
                    key: 'onAuction',
                    activeClass: 'bg-orange-500 border-orange-500'
                  }
                ].map((status) => (
                  <label key={status.key} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-6 w-6 rounded-xl border-2 flex items-center justify-center transition-all ${statusFilters[status.key as keyof typeof statusFilters]
                          ? status.activeClass // Apply the full string here
                          : 'border-primary/10 group-hover:border-primary/30'
                          }`}
                      >
                        {statusFilters[status.key as keyof typeof statusFilters] && (
                          <div className="h-2 w-2 rounded-full bg-white shadow-lg" />
                        )}
                      </div>
                      <span className={`text-sm font-black tracking-tight group-hover:text-primary transition-colors flex items-center gap-2.5`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      hidden
                      checked={statusFilters[status.key as keyof typeof statusFilters]}
                      onChange={(e) => setStatusFilters({ ...statusFilters, [status.key]: e.target.checked })}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6 pt-10 border-t border-primary/5">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] text-muted-foreground">Value Range (ETH)</h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/50 z-10">MIN</div>
                  <Input
                    placeholder="0.01"
                    type="number"
                    value={priceRange.min}
                    onChange={(e: any) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="rounded-2xl h-14 pl-14 bg-secondary/50 border-none font-black text-sm"
                  />
                </div>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/50 z-10">MAX</div>
                  <Input
                    placeholder="10.0"
                    type="number"
                    value={priceRange.max}
                    onChange={(e: any) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="rounded-2xl h-14 pl-14 bg-secondary/50 border-none font-black text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 space-y-3">
              <div className="flex items-center gap-2 text-amber-600">
                <Award className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Loyalty Multiplier</span>
              </div>
              <p className="text-xs font-bold leading-relaxed text-amber-700/80">
                Earn 10 points for every 1 ETH spent or received. Points increase your rank!
              </p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 p-8 rounded-[2.5rem] bg-card/40 backdrop-blur-md border border-primary/5 shadow-xl">
            <div className="flex items-center gap-5">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Grid className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-black text-lg tracking-tight">{filteredItems.length} Assets Found</h4>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Worldwide distribution</p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ordering</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-secondary/80 rounded-2xl text-xs font-black border-none cursor-pointer h-12 px-6 pr-10 outline-none appearance-none transition-all hover:bg-secondary w-full sm:w-48"
              >
                <option value="recent">Recently Minted</option>
                <option value="price_asc">Price: Ascending</option>
                <option value="price_desc">Price: Descending</option>
              </select>
            </div>
          </div>

          <NFTGrid
            items={filteredItems}
            isLoading={isLoading}
            onBuy={handleBuy}
            onCancel={handleCancel}
            userAccount={account}
          />

          {!isLoading && filteredItems.length === 0 && (
            <div className="py-40 text-center space-y-6">
              <div className="inline-flex h-24 w-24 rounded-full bg-secondary items-center justify-center">
                <Search className="h-10 w-10 text-muted-foreground/20" />
              </div>
              <h3 className="text-2xl font-black">No matches found</h3>
              <p className="text-muted-foreground font-medium">Try adjusting your filters or search query.</p>
              <Button
                variant="outline"
                onClick={() => { setSearchQuery(''); setPriceRange({ min: '', max: '' }); setStatusFilters({ buyNow: true, onAuction: true, isNew: false }); }}
                className="rounded-2xl px-10 h-14 font-black mt-4"
              >
                Reset All Filters
              </Button>
            </div>
          )}
        </div>
      </div >
    </div >
  );
};

export default Explore;
