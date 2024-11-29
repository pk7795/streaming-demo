import * as process from 'process';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { Buffer } from 'buffer';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';

// contexts
import SettingsProvider from './contexts/SettingsContext';
import { store } from './redux/store';
import {
  arbitrum,
  avalanche,
  bsc,
  gnosis,
  mainnet,
  optimism,
  polygon,
  zkSync,
  zora,
  base,
  celo,
  aurora,
} from 'wagmi/chains';
import { DOMAIN_APP } from './config';

window.global = window;
window.process = process;
const root = ReactDOM.createRoot(document.getElementById('root'));
const queryClient = new QueryClient();
if (!window.Buffer) {
  window.Buffer = Buffer;
}

const chains = [mainnet, polygon, avalanche, arbitrum, bsc, optimism, gnosis, zkSync, zora, base, celo, aurora];

const projectId = process.env.REACT_APP_PROJECT_ID || ''; // this is projectId of WalletConnect lib

const metadata = {
  name: 'ErmisChat',
  description: 'The Next-Gen Web3 Communication Infrastructure',
  url: DOMAIN_APP,
  icons: ['https://ermis.network/images/photo_Layer_1.png'],
};

const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

createWeb3Modal({ wagmiConfig, projectId, chains });

root.render(
  // <React.StrictMode>
  <WagmiProvider config={wagmiConfig}>
    <HelmetProvider>
      <ReduxProvider store={store}>
        <SettingsProvider>
          <BrowserRouter>
            <QueryClientProvider client={queryClient}>
              <App />
            </QueryClientProvider>
          </BrowserRouter>
        </SettingsProvider>
      </ReduxProvider>
    </HelmetProvider>
  </WagmiProvider>,
  // </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
