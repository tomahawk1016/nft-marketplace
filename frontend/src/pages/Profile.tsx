import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { User, Copy, Share2, Grid, History, Settings, ExternalLink, Tag, CheckCircle2, Gavel, Award, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWeb3 } from '../hooks/useWeb3';
import { resolveIPFS } from '../lib/ipfs';
import NFTGrid from '../components/NFTGrid';
import { NFTItem } from '../components/NFTCard';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'react-hot-toast';
import { Badge } from '../components/ui/badge';

const Profile: React.FC = () => {
  const { account, nftContract, marketplaceContract, loyaltyPoints, refreshLoyaltyPoints } = useWeb3();
  const [ownedNFTs, setOwnedNFTs] = useState<NFTItem[]>([]);
  const [listedNFTs, setListedNFTs] = useState<NFTItem[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [auctionNFTs, setAuctionNFTs] = useState<NFTItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    darkMode: false,
    publicProfile: true
  });

  useEffect(() => {
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.darkMode]);

  const fetchProfileData = async () => {
    if (!account || !nftContract || !marketplaceContract) return;

    try {
      setIsLoading(true);
      await refreshLoyaltyPoints();
      const totalTokens = await nftContract.tokenCount();
      const owned: NFTItem[] = [];

      for (let i = 1; i <= Number(totalTokens); i++) {
        try {
          const owner = await nftContract.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            const tokenURI = await nftContract.tokenURI(i);
            const resolvedURI = resolveIPFS(tokenURI);
            let metadata = { name: `NFT #${i}`, image: '', description: '', category: '' };
            try {
              const response = await fetch(resolvedURI);
              metadata = await response.json();
            } catch (e) {
              console.error('Error fetching metadata:', e);
            }

            owned.push({
              tokenId: i,
              seller: account,
              owner: account,
              price: null,
              nftAddress: await nftContract.getAddress(),
              name: metadata.name,
              image: metadata.image,
              description: metadata.description,
              category: metadata.category,
              isListed: false
            });
          }
        } catch (e) {
          console.error(`Error checking token ${i}:`, e);
        }
      }
      setOwnedNFTs(owned);

      const listings = await marketplaceContract.getAllListings();
      const userListings: NFTItem[] = [];

      for (let i = 0; i < listings.length; i++) {
        const listing = listings[i];
        if (listing.seller.toLowerCase() === account.toLowerCase()) {
          const tokenURI = await nftContract.tokenURI(listing.tokenId);
          const resolvedURI = resolveIPFS(tokenURI);

          let metadata = { name: `NFT #${listing.tokenId}`, image: '', description: '', category: '' };
          try {
            const response = await fetch(resolvedURI);
            metadata = await response.json();
          } catch (e) {
            console.error('Error fetching metadata:', e);
          }

          userListings.push({
            listingId: i,
            tokenId: Number(listing.tokenId),
            seller: account,
            price: listing.price.toString(),
            nftAddress: listing.nft,
            name: metadata.name,
            image: metadata.image,
            description: metadata.description,
            category: metadata.category,
            isListed: true
          });
        }
      }
      setListedNFTs(userListings);

      const auctions = await marketplaceContract.getAllAuctions();
      const userAuctions: NFTItem[] = [];

      for (let i = 0; i < auctions.length; i++) {
        const auction = auctions[i];
        if (auction.seller.toLowerCase() === account.toLowerCase() && auction.active) {
          const tokenURI = await nftContract.tokenURI(auction.tokenId);
          const response = await fetch(resolveIPFS(tokenURI));
          const metadata = await response.json();

          userAuctions.push({
            auctionId: i,
            tokenId: Number(auction.tokenId),
            seller: account,
            price: '0',
            nftAddress: auction.nft,
            name: metadata.name,
            image: metadata.image,
            description: metadata.description,
            category: metadata.category,
            isAuction: true,
            minBid: auction.minBid.toString(),
            highestBid: auction.highestBid.toString(),
            endTime: Number(auction.endTime),
            auctionActive: auction.active
          });
        }
      }
      setAuctionNFTs(userAuctions);

      const sales = await marketplaceContract.getSales();
      const userSales = sales.filter((sale: any) =>
        sale.seller.toLowerCase() === account.toLowerCase() ||
        sale.buyer.toLowerCase() === account.toLowerCase()
      );
      setSalesHistory(userSales);

    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to determine Rank based on points
  const getRank = (points: number) => {
    if (points >= 1000) return { name: 'Platinum', color: 'text-violet-500 bg-violet-500/10' };
    if (points >= 500) return { name: 'Gold', color: 'text-amber-500 bg-amber-500/10' };
    if (points >= 100) return { name: 'Silver', color: 'text-slate-400 bg-slate-400/10' };
    return { name: 'Bronze', color: 'text-orange-700 bg-orange-700/10' };
  };

  const rank = getRank(loyaltyPoints);

  useEffect(() => {
    fetchProfileData();
  }, [account, nftContract, marketplaceContract]);

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast.success('Address copied');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied');
  };

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center mb-8">
          <User className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Please connect your wallet</h2>
        <Button size="lg" className="rounded-xl px-12 h-14 font-bold">Connect Wallet</Button>
      </div>
    );
  }

  return (
    <div className="space-y-0 min-h-screen">
      <div className="h-64 md:h-96 w-full bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="relative -mt-32 md:-mt-40 mb-16 space-y-8 text-center md:text-left">
          <div className="relative inline-block group">
            <div className="h-40 w-40 md:h-56 md:w-56 rounded-[3rem] border-8 border-background overflow-hidden shadow-2xl relative z-10 bg-secondary">
              <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${account}`} alt="Avatar" className="h-full w-full" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Collector</h1>
                <Badge className={`${rank.color} border-none rounded-xl px-4 py-1 font-black text-xs uppercase tracking-widest flex items-center gap-2`}>
                  <Sparkles className="h-3 w-3" />
                  {rank.name} Tier
                </Badge>
                <Badge className="bg-primary/10 text-primary border-none rounded-xl px-4 py-1 font-black text-xs uppercase tracking-widest">Verified</Badge>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-card/50 backdrop-blur-md border border-primary/5 text-sm font-black shadow-lg">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  <span className="font-mono">{account.slice(0, 8)}...{account.slice(-8)}</span>
                </div>
                <Button variant="outline" size="icon" onClick={handleCopyAddress} className="h-12 w-12 rounded-2xl border-2 hover:bg-secondary shadow-lg">
                  <Copy className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare} className="h-12 w-12 rounded-2xl border-2 hover:bg-secondary shadow-lg">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-8 px-8 py-3 rounded-[2.5rem] bg-card/50 backdrop-blur-md border border-primary/5 shadow-2xl">
                <div className="text-center space-y-1">
                  <p className="text-3xl font-black">{ownedNFTs.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Collected</p>
                </div>
                <div className="h-10 w-[1px] bg-primary/10" />
                <div className="text-center space-y-1">
                  <p className="text-3xl font-black">{listedNFTs.length + auctionNFTs.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Selling</p>
                </div>
                <div className="h-10 w-[1px] bg-primary/10" />
                <div className="text-center space-y-1">
                  <div className="flex items-center gap-2 justify-center">
                    <p className="text-3xl font-black text-amber-500 animate-pulse">{loyaltyPoints}</p>
                    <Award className="h-5 w-5 text-amber-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loyalty Points</p>
                </div>
              </div>
              <Button variant="outline" className="h-16 w-40 rounded-[2rem] border-2 shadow-xl hover:bg-secondary" onClick={() => setShowSettings(true)}>
                <Settings className="h-6 w-6" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="collected" className="w-full space-y-16 pb-20">
          <TabsList className="bg-primary/5 p-2 rounded-[2.5rem] w-full max-w-2xl mx-auto flex h-auto gap-2">
            {[
              { id: 'collected', label: 'Collected', icon: <Grid className="h-4 w-4" />, count: ownedNFTs.length },
              { id: 'selling', label: 'Selling', icon: <Tag className="h-4 w-4" />, count: listedNFTs.length },
              { id: 'auctions', label: 'Auctions', icon: <Gavel className="h-4 w-4" />, count: auctionNFTs.length },
              { id: 'activity', label: 'History', icon: <History className="h-4 w-4" />, count: null }
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-xl py-4 rounded-[2rem] font-black text-sm gap-3 transition-all"
              >
                {tab.icon}
                {tab.label}
                {tab.count !== null && <span className="opacity-40 text-xs">{tab.count}</span>}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="collected" className="mt-0"><NFTGrid items={ownedNFTs} isLoading={isLoading} userAccount={account} /></TabsContent>
          <TabsContent value="selling" className="mt-0"><NFTGrid items={listedNFTs} isLoading={isLoading} userAccount={account} onCancel={fetchProfileData} /></TabsContent>
          <TabsContent value="auctions" className="mt-0"><NFTGrid items={auctionNFTs} isLoading={isLoading} userAccount={account} /></TabsContent>

          <TabsContent value="activity" className="mt-0">
            <Card className="rounded-[3rem] border-none bg-card/50 backdrop-blur-md overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-primary/5 border-b border-primary/5">
                    <tr>
                      <th className="p-8 font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">Event</th>
                      <th className="p-8 font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">Item</th>
                      <th className="p-8 font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">Price</th>
                      <th className="p-8 font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">To</th>
                      <th className="p-8 font-black text-xs uppercase tracking-[0.2em] text-muted-foreground text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {salesHistory.length > 0 ? (
                      salesHistory.map((sale: any, i: number) => (
                        <tr key={i} className="hover:bg-primary/5 transition-colors group">
                          <td className="p-8">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                <CheckCircle2 className="h-5 w-5" />
                              </div>
                              <span className="font-black">Sale</span>
                            </div>
                          </td>
                          <td className="p-8"><span className="font-black">NFT #{sale.tokenId.toString()}</span></td>
                          <td className="p-8"><div className="flex items-center gap-2 font-black">{ethers.formatEther(sale.price)}<span className="text-[10px] text-primary">ETH</span></div></td>
                          <td className="p-8"><div className="px-4 py-1.5 rounded-xl bg-secondary/50 font-mono text-xs font-bold w-fit">{sale.buyer.slice(0, 6)}...{sale.buyer.slice(-4)}</div></td>
                          <td className="p-8 text-right"><div className="flex flex-col items-end gap-1"><span className="font-black text-sm">{new Date(Number(sale.timestamp) * 1000).toLocaleDateString()}</span><ExternalLink className="h-3.5 w-3.5 opacity-30 group-hover:opacity-100" /></div></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} className="p-24 text-center text-muted-foreground font-bold">No activity found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card p-10 rounded-[3rem] w-full max-w-lg space-y-10 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black tracking-tight">Settings</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>✕</Button>
            </div>
            <div className="space-y-6">
              {[
                { label: 'Email Notifications', key: 'emailNotifications' },
                { label: 'Dark Mode', key: 'darkMode' },
                { label: 'Public Profile', key: 'publicProfile' }
              ].map((pref) => (
                <div key={pref.key} className="flex items-center justify-between">
                  <span className="font-bold">{pref.label}</span>
                  <input
                    type="checkbox"
                    checked={(preferences as any)[pref.key]}
                    onChange={(e) => setPreferences({ ...preferences, [pref.key]: e.target.checked })}
                    className="h-6 w-6 rounded border-gray-300 text-primary"
                  />
                </div>
              ))}
            </div>
            <Button className="w-full h-16 rounded-2xl font-black text-lg" onClick={() => setShowSettings(false)}>Save Changes</Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Profile;