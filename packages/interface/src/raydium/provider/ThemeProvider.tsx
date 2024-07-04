import { ChakraProvider } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import type { FC, ReactNode } from 'react';

import { colors } from '@/raydium/theme/cssVariables';
import { SpaceGroteskFont } from '@/styles/fonts';

import { theme } from '../theme';

const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ChakraProvider theme={theme}>
      {/* through object's styles's global can't inject multi font-face */}
      <Global
        styles={`
        html,
        body,
        #__next,
        .app {
          overflow: hidden; /* ensure web app's scrollbar will never exist*/
          height: 100%;
        }
        :root,body {
          --global-font-family: ${SpaceGroteskFont.style.fontFamily};
          font-family: var(--global-font-family);
          font-feature-settings: 'ss04', 'tnum' 1;
          --chakra-fonts-heading: var(--global-font-family);
          --chakra-fonts-body: var(--global-font-family);
          --chakra-fonts-mono: var(--global-font-family);
          font-size: 16px;

          background-color: rgb(18, 28, 52);
          background: linear-gradient(29.71deg, rgb(18, 28, 52) -18.98%, rgb(5, 13, 23) 14.6%, rgb(7, 10, 21) 56.26%, rgba(9, 14, 29, 0.97) 85.27%);
          background-attachment: fixed;
          color: ${colors.textPrimary}
        }
        * {
          box-sizing: border-box;
          outline: none !important; /* without !important, the priority is not high enough */
          --chakra-shadows-outline: none !important;
          /* user-select: none; disable user-select so it is like a web app not web document */
        }
        :focus-visible {
          box-shadow: var(--chakra-shadows-outline);
        }
        input {
          font-weight: inherit;
        }

        input[type='number']::-webkit-outer-spin-button,
        input[type='number']::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        /* Firefox */
        input[type='number'] {
          -moz-appearance: textfield;
        }
        .chakra-icon {
          vertical-align: middle;
          line-height: 1;
        }


        @media (min-width: 48rem) {
          ::-webkit-scrollbar {
            background-color: transparent;
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-thumb {
            background-color: ${colors.scrollbarThumb};
            border-radius: 8px;
          }
          ::-webkit-scrollbar-corner {
            background-color: transparent;
          }
        }
        `}
      />
      {children}
    </ChakraProvider>
  );
};

export default ThemeProvider;
