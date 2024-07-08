import localFont from 'next/font/local';

export const SpaceGroteskFont = localFont({
  src: '../../public/fonts/SpaceGrotesk-VariableFont_wght.ttf',
  fallback: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'PingFang SC',
    'Hiragino Sans GB',
    'Microsoft YaHei',
    'Helvetica Neue',
    'Helvetica',
    'Arial',
    'sans-serif',
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
  ],
});
