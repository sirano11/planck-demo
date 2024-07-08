import { ChakraProvider } from '@chakra-ui/react';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { WagmiProvider } from 'wagmi';

import NavigationBar from '@/components/NavigationBar';
import GlobalColorProvider from '@/raydium/provider/GlobalColorProvider';
import { theme } from '@/raydium/theme';
import { SpaceGroteskFont } from '@/styles/fonts';
import '@/styles/global.css';

import { config } from '../constants/wagmi';

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
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <ChakraProvider theme={theme} cssVarsRoot="html">
          <GlobalColorProvider>
            <WagmiProvider config={config}>
              <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                  <NavigationBar />
                  <Component {...pageProps} />
                </RainbowKitProvider>
              </QueryClientProvider>
            </WagmiProvider>
            <style jsx global>{`
              html,
              body {
                scroll-behavior: smooth;

                .dark & {
                  background-color: #020617 !important;
                }
              }

              body {
                font-family: ${SpaceGroteskFont.style.fontFamily} !important;
              }
            `}</style>
          </GlobalColorProvider>
        </ChakraProvider>
      </ThemeProvider>
    </>
  );
};

export default App;
