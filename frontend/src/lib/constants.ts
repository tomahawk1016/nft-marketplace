export const CONTRACT_ADDRESSES = {
  NFT: import.meta.env.VITE_NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  MARKETPLACE: import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
};

export const SUPPORTED_NETWORKS = {
  SEPOLIA: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Test Network',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  LOCALHOST: {
    chainId: '0x7a69',
    chainName: 'Localhost 8545',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['http://127.0.0.1:8545/'],
    blockExplorerUrls: [],
  },
};

export const PINATA_CONFIG = {
  JWT: import.meta.env.VITE_PINATA_JWT || '',
  GATEWAY: import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
};
