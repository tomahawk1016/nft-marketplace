interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (eventName: string, callback: (...args: any[]) => void) => void;
  // Add other methods/events you need
}

interface Window {
  ethereum?: EthereumProvider;
}


interface EthereumProvider {
  isMetaMask?: boolean;

  // Send RPC requests
  request: (args: { method: string; params?: any[] }) => Promise<any>;

  // Subscribe to events
  on?: (event: string, listener: (...args: any[]) => void) => void;

  // Unsubscribe from events
  removeListener?: (event: string, listener: (...args: any[]) => void) => void;

  // Optional: legacy send
  send?: (method: string, params?: any[]) => Promise<any>;
}

interface Window {
  ethereum?: EthereumProvider;
}

