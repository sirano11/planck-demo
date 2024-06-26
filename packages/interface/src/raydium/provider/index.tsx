import { ReactNode } from 'react';

import GlobalColorProvider from './GlobalColorProvider';
import ThemeProvider from './ThemeProvider';

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <GlobalColorProvider>{children}</GlobalColorProvider>
    </ThemeProvider>
  );
};
