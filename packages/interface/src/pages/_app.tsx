import { getCookie } from 'cookies-next';
import Decimal from 'decimal.js';
import type { AppContext, AppProps } from 'next/app';
import App from 'next/app';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

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

const CONTENT_ONLY_PATH = ['/', '404', '/docs/disclaimer'];
const OVERFLOW_HIDDEN_PATH = ['/liquidity-pools'];

Decimal.set({ precision: 1e3 });

const MyApp = ({
  Component,
  pageProps,
  lng,
  ...props
}: AppProps & { lng: string }) => {
  const { pathname } = useRouter();

  const [onlyContent, overflowHidden] = useMemo(
    () => [
      CONTENT_ONLY_PATH.includes(pathname),
      OVERFLOW_HIDDEN_PATH.includes(pathname),
    ],
    [pathname],
  );

  // if (isLocal()) {
  //   const lang = lng || (getCookie('i18nextLng') as string) || 'en'
  //   i18n.changeLanguage(lang)
  // }

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
      <DynamicProviders>
        <DynamicContent {...props}>
          {onlyContent ? (
            <Component {...pageProps} />
          ) : (
            <DynamicAppNavLayout overflowHidden={overflowHidden}>
              <Component {...pageProps} />
            </DynamicAppNavLayout>
          )}
        </DynamicContent>
      </DynamicProviders>
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
