import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, base, mainnet, optimism, polygon } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Planck Demo',
  projectId: '331be4b8f55c12c1cbc8cb7b2a240a35',
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true,
});
