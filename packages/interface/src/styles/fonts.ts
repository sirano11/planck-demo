import localFont from 'next/font/local';

export const ArchivoFont = localFont({
  src: '../../public/fonts/Archivo-VariableFont_wdth,wght.ttf',
  fallback: [
    'Pretendard',
    'Inter',
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
  ],
});

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
