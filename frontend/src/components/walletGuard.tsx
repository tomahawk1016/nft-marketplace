import React, { useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { Button } from './ui/button';
import { Wallet, ShieldAlert } from 'lucide-react';

interface WalletGuardProps {
  children: React.ReactNode;
}

const WalletGuard: React.FC<WalletGuardProps> = ({ children }) => {
  const { account, setIsConnectModalOpen, isLoading } = useWeb3();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="h-24 w-24 rounded-full bg-red-500/10 flex items-center justify-center mb-8">
          <ShieldAlert className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Restricted Access</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          This page is only accessible to connected users. Please connect your wallet to proceed.
        </p>
        <Button 
          size="lg" 
          className="rounded-xl px-12 h-14 font-bold gap-2"
          onClick={() => setIsConnectModalOpen(true)}
        >
          <Wallet className="h-5 w-5" />
          Connect Wallet
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default WalletGuard;
