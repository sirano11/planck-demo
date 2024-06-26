import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { WagmiProvider } from 'wagmi';
import { arbitrum, base, mainnet, optimism, polygon } from 'wagmi/chains';

import NavigationBar from '@/components/NavigationBar';
import '@/styles/global.css';

const config = getDefaultConfig({
  appName: 'Planck Demo',
  projectId: '331be4b8f55c12c1cbc8cb7b2a240a35',
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true,
});

const queryClient = new QueryClient();

const App: React.FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <title>Planck Demo</title>
      </Head>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <NavigationBar />
            <Component {...pageProps} />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </>
  );
};

export default App;
