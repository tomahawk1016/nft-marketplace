import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-secondary/30 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary/20 transform group-hover:-rotate-180 transition-transform duration-1000">
                O
              </div>
              <span className="font-bold text-xl">Open NFT Marketplace</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs">
              The world's first and largest digital marketplace for crypto collectibles and non-fungible tokens (NFTs). Buy, sell, and discover exclusive digital items.
            </p>
            <div className="flex gap-4">
              <Link to="http://Linkedin.com" target='_blank'>
                <Linkedin className='h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer' />
              </Link>
              <Link to="http://Github.com" target='_blank'>
                <Github className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6">Marketplace</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link to="/explore" className="hover:text-primary">All NFTs</Link></li>
              <li><Link to="/explore?category=art" className="hover:text-primary">Art</Link></li>
              <li><Link to="/explore?category=gaming" className="hover:text-primary">Gaming</Link></li>
              <li><Link to="/explore?category=music" className="hover:text-primary">Music</Link></li>
              <li><Link to="/explore?category=photography" className="hover:text-primary">Photography</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">My Account</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link to="/profile" className="hover:text-primary">Profile</Link></li>
              <li><Link to="/profile?tab=favorites" className="hover:text-primary">Favorites</Link></li>
              <li><Link to="/profile?tab=watchlist" className="hover:text-primary">Watchlist</Link></li>
              <li><Link to="/profile?tab=collections" className="hover:text-primary">My Collections</Link></li>
              <li><Link to="/create" className="hover:text-primary">Create</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Stats</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link to="/rankings" className="hover:text-primary">Rankings</Link></li>
              <li><Link to="/activity" className="hover:text-primary">Activity</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 OpenMarket NFT Platform. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
