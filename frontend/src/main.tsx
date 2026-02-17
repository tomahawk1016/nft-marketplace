import React from 'react'
import ReactDOM from 'react-dom/client'
import { Web3Provider } from './hooks/useWeb3'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <Web3Provider>
      <App />
    </Web3Provider>
)
