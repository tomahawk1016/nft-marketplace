import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Wallet, Plus, User, Menu, X, LogOut, Gavel, LayoutGrid } from 'lucide-react';
import { useWeb3 } from '../../hooks/useWeb3';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import WalletModal from '../WalletModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const Navbar: React.FC = () => {
  const { account, disconnect, isLoading, isConnectModalOpen, setIsConnectModalOpen, connect } = useWeb3();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchUpdate = (value: string) => {
    setSearchQuery(value);

    const trimmedValue = value.trim();
    if (trimmedValue.length > 0) {
      // Navigate immediately on first letter, use replace to avoid history bloat
      navigate(`/explore?search=${encodeURIComponent(trimmedValue)}`, { replace: true });
    } else {
      // If cleared, navigate to explore without query to show all items
      navigate('/explore', { replace: true });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${searchQuery}`);
    } else {
      navigate('/explore');
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConnect = (type: string) => {
    connect(type);
    setIsConnectModalOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary/20 transform group-hover:-rotate-180 transition-transform duration-1000">
                O
              </div>
              <span className="hidden font-black sm:inline-block text-2xl tracking-tighter">Open NFT Marketplace</span>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden flex-1 max-w-2xl md:flex group">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="search"
                  placeholder="Search NFTs, collections, and accounts..."
                  className="pl-12 h-12 w-full bg-secondary/50 border-2 border-transparent focus:border-primary/20 focus:bg-background rounded-2xl transition-all font-medium"
                  value={searchQuery}
                  onChange={(e) => handleSearchUpdate(e.target.value)}
                />
              </div>
            </form>

            {/* Desktop Nav */}
            <div className="hidden items-center gap-8 lg:flex">
              <Link to="/explore" className="text-sm font-black hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Explore
              </Link>
              <Link to="/create" className="text-sm font-black hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create
              </Link>

              {account ? (
                <div className="flex items-center gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="rounded-2xl gap-3 pl-2 pr-4 h-12 border-2 border-primary/5 hover:border-primary/20 hover:bg-secondary transition-all shadow-md">
                        <div className="h-8 w-8  rounded-xl overflow-hidden bg-primary/10 border-2 border-white shadow-sm">
                          <User className="h-5 w-5 object-cover mt-1 ml-1" />
                        </div>
                        <span className="text-sm font-black">{truncateAddress(account)}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 rounded-[1.5rem] p-3 shadow-2xl border-primary/5 backdrop-blur-xl">
                      <DropdownMenuLabel className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground px-4 py-3 opacity-70">Account</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-primary/5" />
                      <DropdownMenuItem asChild className="rounded-xl focus:bg-primary focus:text-white transition-all">
                        <Link to="/profile" className="cursor-pointer px-4 py-3 flex items-center gap-3 font-bold">
                          <User className="h-5 w-5" />
                          <span>My Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl focus:bg-primary focus:text-white transition-all">
                        <Link to="/create" className="cursor-pointer px-4 py-3 flex items-center gap-3 font-bold">
                          <Plus className="h-5 w-5" />
                          <span>Mint NFT</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-primary/5" />
                      <DropdownMenuItem
                        onClick={disconnect}
                        className="cursor-pointer rounded-xl px-4 py-3 flex items-center gap-3 text-red-500 font-bold focus:bg-red-50 focus:text-red-600 transition-all"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Disconnect</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button
                  onClick={() => setIsConnectModalOpen(true)}
                  disabled={isLoading}
                  className="gap-3 rounded-2xl h-12 px-8 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all"
                >
                  <Wallet className="h-5 w-5" />
                  Connect
                </Button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="flex lg:hidden items-center justify-center h-12 w-12 rounded-2xl bg-secondary/50 border border-primary/5 shadow-sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t bg-background/95 backdrop-blur-xl p-6 flex flex-col gap-6 animate-in slide-in-from-top duration-300 shadow-2xl">
            <form onSubmit={handleSearchSubmit} className="flex md:hidden group">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-12 h-14 w-full bg-secondary/50 border-none rounded-2xl font-bold"
                  value={searchQuery}
                  onChange={(e) => handleSearchUpdate(e.target.value)}
                />
              </div>
            </form>
            <div className="grid grid-cols-1 gap-3">
              <Link
                to="/explore"
                className="text-lg font-black py-4 px-6 rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center gap-4 shadow-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                <LayoutGrid className="h-6 w-6" />
                Explore Marketplace
              </Link>
              <Link
                to="/create"
                className="text-lg font-black py-4 px-6 rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center gap-4 shadow-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                <Plus className="h-6 w-6" />
                Create New NFT
              </Link>
            </div>

            <div className="pt-4 border-t border-primary/5">
              {account ? (
                <div className="space-y-3">
                  <Link
                    to="/profile"
                    className="text-lg font-black py-4 px-6 rounded-2xl bg-secondary/50 flex items-center gap-4 shadow-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-6 w-6 text-primary" />
                    Profile ({truncateAddress(account)})
                  </Link>
                  <Button
                    variant="destructive"
                    onClick={() => { disconnect(); setIsMenuOpen(false); }}
                    className="w-full h-14 rounded-2xl font-black text-lg gap-3 shadow-xl shadow-red-500/10"
                  >
                    <LogOut className="h-6 w-6" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => { setIsConnectModalOpen(true); setIsMenuOpen(false); }}
                  disabled={isLoading}
                  className="w-full h-16 rounded-2xl font-black text-xl gap-4 shadow-2xl shadow-primary/20"
                >
                  <Wallet className="h-7 w-7" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>

      <WalletModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnect={handleConnect}
      />
    </>
  );
};

export default Navbar;
