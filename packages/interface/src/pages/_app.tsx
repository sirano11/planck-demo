import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getCookie } from 'cookies-next';
import Decimal from 'decimal.js';
import type { AppContext, AppProps } from 'next/app';
import App from 'next/app';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { WagmiProvider } from 'wagmi';
import { arbitrum, base, mainnet, optimism, polygon } from 'wagmi/chains';

// import 'react-day-picker/dist/style.css';
// import '@/raydium/components/LandingPage/components/tvl.css';
// import '@/raydium/components/LandingPage/liquidity.css';
// import '@/raydium/components/Toast/toast.css';
import i18n from '@/raydium/i18n';
import { isLocal } from '@/raydium/utils/common';
import { isClient } from '@/raydium/utils/common';

const DynamicProviders = dynamic(() =>
  import('@/raydium/provider').then((mod) => mod.Providers),
);
const DynamicContent = dynamic(() => import('@/raydium/components/Content'));
const DynamicAppNavLayout = dynamic(
  () => import('@/raydium/components/AppLayout/AppNavLayout'),
);

Decimal.set({ precision: 1e3 });

const config = getDefaultConfig({
  appName: 'RainbowKit demo',
  projectId: '331be4b8f55c12c1cbc8cb7b2a240a35', // WalletConnect에서 발급받은 프로젝트 ID
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true, // Next.js를 위한 서버 사이드 렌더링 지원
  /* Wagmi createConfig options including `transports` are also accepted */
});

const queryClient = new QueryClient();

const MyApp = ({
  Component,
  pageProps,
  lng,
  ...props
}: AppProps & { lng: string }) => {
  const { pathname } = useRouter();

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <title>
          {pageProps.title ? `Raydium ${pageProps.title}` : 'Raydium'}
        </title>
      </Head>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <DynamicProviders>
              <DynamicContent {...props}>
                {/* <DynamicAppNavLayout overflowHidden={false}> */}
                <Component {...pageProps} />
                {/* </DynamicAppNavLayout> */}
              </DynamicContent>
            </DynamicProviders>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </>
  );
};

MyApp.getInitialProps = async (appContext: AppContext) => {
  if (isClient()) return {};
  try {
    const ctx = await App.getInitialProps(appContext);
    let lng = getCookie('i18nextLng', {
      req: appContext.ctx.req,
      res: appContext.ctx.res,
    }) as string;
    lng = lng || 'en';
    i18n.changeLanguage(lng);

    return ctx;
  } catch (err) {
    return {};
  }
};

export default MyApp;
