import React from 'react';
import { X, Wallet } from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const { connect, isLoading } = useWeb3();

  const handleConnectMetaMask = async () => {
    await connect();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Connect Wallet</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="h-16 rounded-2xl flex items-center justify-between px-6 border-2 hover:border-primary transition-all group"
            onClick={handleConnectMetaMask}
            disabled={isLoading}
          >
            <div className="flex items-center gap-4">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Monkey_Face.svg"
                alt="MetaMask"
                className="h-8 w-8"
              />
              <span className="font-bold text-lg">MetaMask</span>
            </div>
            <div className="text-xs font-bold text-muted-foreground group-hover:text-primary uppercase tracking-widest">
              Popular
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-16 rounded-2xl flex items-center justify-between px-6 border-2 opacity-50 cursor-not-allowed"
            disabled
          >
            <div className="flex items-center gap-4">
              <Wallet className="h-8 w-8 text-blue-500" />
              <span className="font-bold text-lg">WalletConnect</span>
            </div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Soon
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-16 rounded-2xl flex items-center justify-between px-6 border-2 opacity-50 cursor-not-allowed"
            disabled
          >
            <div className="flex items-center gap-4">
              <img
                src="https://avatars.githubusercontent.com/u/18060234?s=200&v=4"
                alt="Coinbase"
                className="h-8 w-8 rounded-full"
              />
              <span className="font-bold text-lg">Coinbase Wallet</span>
            </div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Soon
            </div>
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectModal;
