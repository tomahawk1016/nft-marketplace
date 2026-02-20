import React from 'react';
import { X, Wallet, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (type: string) => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onConnect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-[3rem] bg-card p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Wallet className="h-48 w-48" />
        </div>

        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tight">Connect <span className="text-primary">Wallet</span></h2>
            <p className="text-muted-foreground font-bold">Choose your gateway to the NFT world.</p>
          </div>
          <button
            onClick={onClose}
            className="h-14 w-14 flex items-center justify-center hover:bg-secondary rounded-[1.5rem] transition-all border border-primary/5 shadow-inner"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 relative z-10">
          {[
            {
              id: 'metamask',
              name: 'MetaMask',
              desc: 'The most popular crypto wallet',
              icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
              popular: true
            },
            {
              id: 'coinbase',
              name: 'Coinbase Wallet',
              desc: 'Trusted by millions worldwide',
              icon: 'https://avatars.githubusercontent.com/u/18060234?s=200&v=4',
              disabled: true
            }
          ].map((wallet) => (
            <button
              key={wallet.id}
              disabled={wallet.disabled}
              className={`w-full group p-6 rounded-[2rem] border-2 transition-all duration-300 flex items-center justify-between ${wallet.disabled ? 'opacity-40 grayscale cursor-not-allowed border-transparent' : 'bg-secondary/30 border-primary/5 hover:border-primary hover:bg-primary/5 hover:shadow-xl hover:shadow-primary/5'}`}
              onClick={() => !wallet.disabled && onConnect(wallet.id)}
            >
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-white shadow-lg flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-500">
                  <img src={wallet.icon} alt={wallet.name} className="h-full w-full object-contain" />
                </div>
                <div className="text-left space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black tracking-tight">{wallet.name}</span>
                    {wallet.popular && (
                      <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">Popular</span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-muted-foreground opacity-70">{wallet.desc}</p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                <ArrowRight className="h-5 w-5 text-primary" />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-primary/5 flex items-center gap-4 text-muted-foreground relative z-10">
          <ShieldCheck className="h-6 w-6 text-green-500" />
          <p className="text-xs font-bold leading-relaxed">
            Your security is our priority. By connecting, you agree to our <span className="text-foreground underline cursor-pointer">Terms of Service</span> and <span className="text-foreground underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default WalletModal;
