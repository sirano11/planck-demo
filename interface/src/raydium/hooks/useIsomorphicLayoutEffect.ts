import { useEffect, useLayoutEffect } from 'react';

import { isClient } from '@/raydium/utils/common';

export const useIsomorphicLayoutEffect = isClient()
  ? useLayoutEffect
  : useEffect;
