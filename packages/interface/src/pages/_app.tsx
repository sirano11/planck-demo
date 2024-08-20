import { ChakraProvider } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { WagmiProvider } from 'wagmi';

import { JobStatusProvider } from '@/components/JobStatusContext';
import NavigationBar from '@/components/NavigationBar';
import { SideBar } from '@/components/SideBar';
import GlobalColorProvider from '@/raydium/provider/GlobalColorProvider';
import { theme } from '@/raydium/theme';
import { SpaceGroteskFont } from '@/styles/fonts';
import '@/styles/global.css';

import { config } from '../constants/wagmi';

const queryClient = new QueryClient();

const App: React.FC<AppProps> = ({ Component, pageProps }) => {
  const router = useRouter();

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
                <RainbowKitProvider locale="en">
                  <JobStatusProvider>
                    <NavigationBar />
                    <Layout>
                      {router.pathname !== '/solana' && <SideBar />}
                      <div className="flex-1 px-5">
                        <Component {...pageProps} />
                      </div>
                    </Layout>
                  </JobStatusProvider>
                  <ToastContainer />
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

              .Toastify *,
              div.wkit-dialog__content,
              div.wkit-dialog__content *,
              div.wkit-connected-container * {
                font-family: ${SpaceGroteskFont.style.fontFamily} !important;
              }

              *[data-testid='rk-connect-button'],
              *[data-testid='rk-account-button'],
              *[data-testid='rk-account-button'] *,
              *[role='dialog'],
              *[role='dialog'] * {
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

const Layout = styled.div`
  display: flex;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;

  @media screen and (max-width: 700px) {
    flex-direction: column;
  }
`;
