import { ChakraProvider } from '@chakra-ui/react';
import type { FC, ReactNode } from 'react';

import { theme } from '../theme';

const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return <ChakraProvider theme={theme}>{children}</ChakraProvider>;
};

export default ThemeProvider;
