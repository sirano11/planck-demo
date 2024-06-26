import { Archivo } from 'next/font/google';

export const ArchivoFont = Archivo({
  subsets: ['latin'],
  fallback: [
    'Pretendard',
    'Inter',
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
  ],
});
