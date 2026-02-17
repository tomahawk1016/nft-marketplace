import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Create from './pages/Create';
import Profile from './pages/Profile';
import NFTDetails from './pages/NFTDetails';
import WalletGuard from './components/walletGuard';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/create" element={
            <WalletGuard>
              <Create />
            </WalletGuard>
          } />
          <Route path="/profile" element={
            <WalletGuard>
              <Profile />
            </WalletGuard>
          } />
          <Route path="/nft/:nftAddress/:tokenId" element={
            <WalletGuard>
              <NFTDetails />
            </WalletGuard>
          } />
        </Routes>
      </Layout>
      <Toaster position="top-center" />
    </Router>
  );
}

export default App;
