import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Shield, Zap, TrendingUp, Sparkles, Trophy, Gavel, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWeb3 } from '../hooks/useWeb3';
import NFTGrid from '../components/NFTGrid';
import { Button } from '../components/ui/button';
import { ethers } from 'ethers';
import { resolveIPFS } from '../lib/ipfs';
import { Card } from '../components/ui/card';

const Home: React.FC = () => {
  const { marketplaceContract, account, nftContract } = useWeb3();
  const [featuredNFTs, setFeaturedNFTs] = useState<any[]>([]);
  const [heroNFT, setHeroNFT] = useState<any>(null);
  const [stats, setStats] = useState({
    collections: '0',
    volume: '0',
    artists: '0',
    topSaleIncrease: '+0%'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMarketplaceData = async () => {
      setIsLoading(true);
      try {
        if (marketplaceContract && nftContract) {
          const [listings, auctions, sales] = await Promise.all([
            marketplaceContract.getAllListings(),
            marketplaceContract.getAllAuctions(),
            marketplaceContract.getSales()
          ]);

          // Process stats
          const uniqueNFTs = new Set();
          const uniqueSellers = new Set();
          let totalVolume = BigInt(0);
          let highestSale = BigInt(0);

          sales.forEach((sale: any) => {
            uniqueNFTs.add(sale.nft.toLowerCase());
            uniqueSellers.add(sale.seller.toLowerCase());
            totalVolume += BigInt(sale.price);
            if (BigInt(sale.price) > highestSale) {
              highestSale = BigInt(sale.price);
            }
          });

          listings.forEach((l: any) => {
            uniqueNFTs.add(l.nft.toLowerCase());
            uniqueSellers.add(l.seller.toLowerCase());
          });

          auctions.forEach((a: any) => {
            uniqueNFTs.add(a.nft.toLowerCase());
            uniqueSellers.add(a.seller.toLowerCase());
          });

          setStats({
            collections: uniqueNFTs.size > 0 ? `${uniqueNFTs.size}` : '12',
            volume: ethers.formatEther(totalVolume).slice(0, 6),
            artists: uniqueSellers.size > 0 ? `${uniqueSellers.size}` : '45',
            topSaleIncrease: highestSale > 0 ? `+${(Number(ethers.formatEther(highestSale)) * 10).toFixed(1)}%` : '+12.5%'
          });

          if (listings.length > 0 || auctions.length > 0) {
            // Process real listings for featured grid
            const formattedListings = await Promise.all(
              listings.slice(0, 4).map(async (listing: any, index: number) => {
                const tokenURI = await nftContract.tokenURI(listing.tokenId);
                const response = await fetch(resolveIPFS(tokenURI));
                const metadata = await response.json();
                return {
                  listingId: index,
                  tokenId: Number(listing.tokenId),
                  seller: listing.seller,
                  price: listing.price.toString(),
                  nftAddress: listing.nft,
                  name: metadata.name,
                  image: metadata.image,
                  category: metadata.category,
                  isListed: true
                };
              })
            );

            const formattedAuctions = await Promise.all(
              auctions.slice(0, 4).map(async (auction: any, index: number) => {
                const tokenURI = await nftContract.tokenURI(auction.tokenId);
                const response = await fetch(resolveIPFS(tokenURI));
                const metadata = await response.json();
                return {
                  auctionId: index,
                  tokenId: Number(auction.tokenId),
                  seller: auction.seller,
                  price: '0',
                  nftAddress: auction.nft,
                  name: metadata.name,
                  image: metadata.image,
                  category: metadata.category,
                  isAuction: true,
                  minBid: auction.minBid.toString(),
                  highestBid: auction.highestBid.toString(),
                  endTime: Number(auction.endTime),
                  auctionActive: auction.active
                };
              })
            );

            const allFetched = [...formattedListings, ...formattedAuctions];
            setFeaturedNFTs(allFetched);

            // Select Hero NFT: Highest price or highest bid
            const sorted = [...allFetched].sort((a, b) => {
              const valA = BigInt(a.isAuction ? (a.highestBid !== '0' ? a.highestBid : a.minBid) : a.price);
              const valB = BigInt(b.isAuction ? (b.highestBid !== '0' ? b.highestBid : b.minBid) : b.price);
              return valB > valA ? 1 : -1;
            });
            setHeroNFT(sorted[0]);
          } else {
            // Mock data
            const mocks = [
              {
                tokenId: 1,
                seller: "0x1234...5678",
                price: ethers.parseEther("0.5").toString(),
                nftAddress: "0x0",
                name: "Cyber Apes #1",
                image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=1000",
                category: "Art",
                isListed: true
              },
              {
                tokenId: 2,
                seller: "0x8765...4321",
                price: ethers.parseEther("1.2").toString(),
                nftAddress: "0x0",
                name: "Neon Nights #42",
                image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000",
                category: "Collectibles",
                isAuction: true,
                minBid: ethers.parseEther("1.0").toString(),
                highestBid: ethers.parseEther("1.5").toString(),
                endTime: Math.floor(Date.now() / 1000) + 86400,
                auctionActive: true
              }
            ];
            setFeaturedNFTs(mocks);
            setHeroNFT(mocks[1]); // Default to the auction one
          }
        } else {
          // Mock data when disconnected
          const mocks = [
            {
              tokenId: 1,
              seller: "0x1234...5678",
              price: ethers.parseEther("0.5").toString(),
              nftAddress: "0x0",
              name: "Cyber Apes #1",
              image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=1000",
              category: "Photography",
              isListed: true
            },
            {
              tokenId: 2,
              seller: "0x8765...4321",
              price: ethers.parseEther("1.2").toString(),
              nftAddress: "0x0",
              name: "Neon Nights #42",
              image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000",
              category: "Gaming",
              isAuction: true,
              minBid: ethers.parseEther("1.0").toString(),
              highestBid: "0",
              endTime: Math.floor(Date.now() / 1000) + 86400,
              auctionActive: true
            }
          ];
          setFeaturedNFTs(mocks);
          setHeroNFT(mocks[1]); // Default to the auction one
        }
      } catch (error) {
        console.error('Error fetching marketplace data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketplaceData();
  }, [marketplaceContract, nftContract]);

  const categories = [
    { name: 'Art', icon: '🎨', color: 'bg-blue-500/10 text-blue-500' },
    { name: 'Gaming', icon: '🎮', color: 'bg-purple-500/10 text-purple-500' },
    { name: 'Music', icon: '🎵', color: 'bg-green-500/10 text-green-500' },
    { name: 'Photography', icon: '📸', color: 'bg-orange-500/10 text-orange-500' },
    { name: 'Collectibles', icon: '💎', color: 'bg-pink-500/10 text-pink-500' },
    { name: 'Domain Names', icon: '🌐', color: 'bg-cyan-500/10 text-cyan-500' },
  ];

  return (
    <div className="space-y-32 pb-32 overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full -mr-96 -mt-96 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 blur-[100px] rounded-full -ml-72 -mb-72 animate-pulse" />
        </div>

        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -200 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="space-y-10"
          >
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary border border-primary/10 font-bold text-sm">
                <Sparkles className="h-4 w-4" />
                <span>The Future of Digital Ownership</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none">
                Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Limitless</span> Digital NFTs
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl leading-relaxed font-medium">
                OpenMarket is the premier destination for extraordinary NFTs. Create, trade, and auction unique digital assets on the world's most secure marketplace.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <Link to="/explore">
                <Button size="lg" className="rounded-2xl px-10 h-20 text-xl font-black w-full sm:w-auto shadow-2xl shadow-primary/20 hover:-translate-y-1.5 transition-all duration-300">
                  Start Exploring
                </Button>
              </Link>
              <Link to="/create">
                <Button size="lg" variant="outline" className="rounded-2xl px-10 h-20 text-xl font-black w-full sm:w-auto border-4 hover:bg-secondary hover:-translate-y-1.5 transition-all duration-300">
                  Mint Yours
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-primary rounded-[3rem] blur-2xl opacity-10 animate-pulse" />
              {heroNFT ? (
                <Link to={`/nft/${heroNFT.nftAddress}/${heroNFT.tokenId}`}>
                  <Card className="relative overflow-hidden rounded-[3rem] border-none shadow-2xl group h-full">
                    <img
                      src={resolveIPFS(heroNFT.image) || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop'}
                      alt={heroNFT.name}
                      className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute bottom-8 left-8 right-8 p-8 backdrop-blur-2xl bg-black/50 border border-white/20 rounded-[2rem] text-white space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl border-2 border-white overflow-hidden shadow-xl bg-secondary/20">
                            <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${heroNFT.seller}`} alt="Creator" />
                          </div>
                          <div>
                            <h3 className="font-black text-xl">{heroNFT.name}</h3>
                            <p className="text-sm font-bold opacity-70">by @{heroNFT.seller.slice(0, 6)}...{heroNFT.seller.slice(-4)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black uppercase tracking-widest opacity-70">
                            {heroNFT.isAuction ? 'Current Bid' : 'Price'}
                          </p>
                          <p className="text-2xl font-black">
                            {heroNFT.isAuction
                              ? ethers.formatEther(heroNFT.highestBid !== '0' ? heroNFT.highestBid : heroNFT.minBid)
                              : ethers.formatEther(heroNFT.price)} ETH
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ) : (
                <div className="h-full w-full rounded-[3rem] bg-secondary/20 animate-pulse" />
              )}

              {/* Floating Element */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -top-10 -right-10 p-6 backdrop-blur-xl bg-yellow-100/50 border border-yellow-200/70 rounded-3xl shadow-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-500">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/70">Trend Surge</p>
                    <p className="text-xl font-black text-primary">{stats.topSaleIncrease}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="container mx-auto px-4 space-y-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">Trending <span className="text-primary/60">Now</span></h2>
            </div>
            <p className="text-muted-foreground text-lg font-medium">Handpicked exclusive digital assets ready for collection.</p>
          </div>
          <Link to="/explore">
            <Button variant="outline" className="rounded-2xl px-8 h-16 text-lg font-black border-4 hover:bg-secondary gap-2">
              View Marketplace
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <NFTGrid items={featuredNFTs} isLoading={isLoading} userAccount={account} />
      </section>

      {/* Categories */}
      <section className="bg-secondary/30 py-32 relative">
        <div className="container mx-auto px-4 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Browse by <span className="text-primary">Category</span></h2>
            <p className="text-muted-foreground text-lg font-medium">Explore unique assets tailored to your interests.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {categories.map((cat, i) => (
              <Link key={cat.name} to={`/explore?category=${cat.name.toLowerCase()}`}>
                <motion.div
                  whileHover={{ y: -10, scale: 1.05 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center p-10 rounded-[2.5rem] border-2 border-primary/5 bg-card/50 backdrop-blur-md hover:border-primary transition-all duration-500 hover:shadow-2xl group"
                >
                  <span className="text-6xl mb-6 transform group-hover:scale-125 transition-transform duration-500">{cat.icon}</span>
                  <span className="font-black text-lg tracking-tight">{cat.name}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center w-full mx-auto mb-16 relative rounded-[4rem] bg-primary overflow-hidden p-16 md:p-32 shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2000&auto=format&fit=crop')] opacity-m-80 bg-cover bg-center mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-slate-400/30 opacity-90" />
          <h2 className="text-5xl md:text-7xl text-white font-bold -mt-2 mb-5">About OpenMarket</h2>
          <p className="text-white/80 text-xl max-w-3xl mx-auto relative z-10 font-medium">We provide the most secure and comprehensive platform for all your NFT needs.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              icon: <Shield className="h-10 w-10" />,
              title: 'Ultra Secure',
              desc: 'Powered by industry-standard smart contracts and audited blockchain security.',
              color: 'text-blue-500',
              bg: 'bg-blue-500/5'
            },
            {
              icon: <Gavel className="h-10 w-10" />,
              title: 'Live Auctions',
              desc: 'Participate in real-time bidding for the rarest digital masterpieces.',
              color: 'text-orange-500',
              bg: 'bg-orange-500/5'
            },
            {
              icon: <Zap className="h-10 w-10" />,
              title: 'Fast Minting',
              desc: 'Instant NFT creation with optimized IPFS storage integration.',
              color: 'text-purple-500',
              bg: 'bg-purple-500/5'
            }
          ].map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="p-10 rounded-[2.5rem] bg-card/50 backdrop-blur-md border border-primary/5 space-y-6 hover:shadow-xl transition-all group"
            >
              <div className={`h-20 w-20 ${feat.bg} ${feat.color} rounded-3xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500`}>
                {feat.icon}
              </div>
              <h3 className="text-2xl font-black tracking-tight">{feat.title}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed font-medium">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="relative rounded-[4rem] bg-primary overflow-hidden p-16 md:p-32 text-center shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2000&auto=format&fit=crop')] opacity-m-80 bg-cover bg-center mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-slate-400/30 opacity-90" />

          <h2 className="text-5xl md:text-7xl font-black text-white relative z-10 tracking-tight leading-tight">
            Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">My Community</span>
          </h2>
          <p className="text-white/80 text-xl max-w-3xl mx-auto relative z-10 font-medium">
            Start your NFT journey today on the most advanced and secure digital art marketplace. Create, collect, and trade with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10 pt-6">
            <Link to="/explore">
              <Button size="lg" className="rounded-2xl px-12 h-20 text-2xl font-black w-full sm:w-auto bg-white text-primary hover:bg-white/90 shadow-2xl shadow-black/20 transform hover:-translate-y-1.5 transition-all duration-300">
                Explore Market
              </Button>
            </Link>
            <Link to="/create">
              <Button size="lg" variant="outline" className="rounded-2xl px-12 h-20 text-2xl font-black w-full sm:w-auto border-4 border-white/20 text-amber-400 hover:bg-white/10 hover:-translate-y-1.5 transition-all duration-300">
                Create NFT
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
