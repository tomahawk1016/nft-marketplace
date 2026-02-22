import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import NFT_ABI from '../contracts/NFT.json';
import MARKETPLACE_ABI from '../contracts/Marketplace.json';
import { CONTRACT_ADDRESSES } from '../lib/constants';

interface Web3ContextType {
  account: string | null;
  chainId: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  nftContract: ethers.Contract | null;
  marketplaceContract: ethers.Contract | null;
  loyaltyPoints: number;
  refreshLoyaltyPoints: () => Promise<void>;
  connect: (walletType?: string) => Promise<void>;
  disconnect: () => void;
  isLoading: boolean;
  error: string | null;
  isConnectModalOpen: boolean;
  setIsConnectModalOpen: (open: boolean) => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [nftContract, setNftContract] = useState<ethers.Contract | null>(null);
  const [marketplaceContract, setMarketplaceContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);

  const fetchLoyaltyPoints = useCallback(async (contract: ethers.Contract, userAddress: string) => {
    try {
      const points = await contract.loyaltyPoints(userAddress);
      setLoyaltyPoints(Number(points));
    } catch (err) {
      console.error("Error fetching loyalty points:", err);
    }
  }, []);

  const refreshLoyaltyPoints = async () => {
    if (marketplaceContract && account) {
      await fetchLoyaltyPoints(marketplaceContract, account);
    }
  };

  const initWeb3 = useCallback(async (ethProvider: any) => {
    try {
      const browserProvider = new ethers.BrowserProvider(ethProvider);
      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setChainId(network.chainId.toString());

      const shouldConnect = localStorage.getItem('isWalletConnected') === 'true';
      if (shouldConnect) {
        const accounts = await browserProvider.send('eth_accounts', []);
        if (accounts.length > 0) {
          const rpcSigner = await browserProvider.getSigner();
          setSigner(rpcSigner);
          setAccount(accounts[0]);

          const nft = new ethers.Contract(CONTRACT_ADDRESSES.NFT, NFT_ABI.abi, rpcSigner);
          const marketplace = new ethers.Contract(CONTRACT_ADDRESSES.MARKETPLACE, MARKETPLACE_ABI.abi, rpcSigner);

          setNftContract(nft);
          setMarketplaceContract(marketplace);
          fetchLoyaltyPoints(marketplace, accounts[0]);
        }
      }
    } catch (err: any) {
      console.error('Web3 Init Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchLoyaltyPoints]);

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      initWeb3(window.ethereum);

      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (localStorage.getItem('isWalletConnected') === 'true') {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            window.location.reload();
          } else {
            setAccount(null);
            setSigner(null);
          }
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    } else {
      setIsLoading(false);
      setError('Please install Metamask');
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', () => { });
        window.ethereum.removeListener('chainChanged', () => { });
      }
    };
  }, [initWeb3]);

  const connect = async (walletType: string = 'metamask') => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setIsLoading(true);

        if (walletType === 'metamask') {
          await window.ethereum.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }]
          });
        }

        await window.ethereum.request({ method: 'eth_requestAccounts' });
        localStorage.setItem('isWalletConnected', 'true');
        await initWeb3(window.ethereum);
      } catch (err: any) {
        setError(err.message);
        localStorage.removeItem('isWalletConnected');
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Please install Metamask');
    }
  };

  const disconnect = () => {
    setAccount(null);
    setSigner(null);
    setNftContract(null);
    setMarketplaceContract(null);
    localStorage.removeItem('isWalletConnected');
    window.location.reload();
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        provider,
        signer,
        nftContract,
        marketplaceContract,
        loyaltyPoints,
        refreshLoyaltyPoints,
        connect,
        disconnect,
        isLoading,
        error,
        isConnectModalOpen,
        setIsConnectModalOpen,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
