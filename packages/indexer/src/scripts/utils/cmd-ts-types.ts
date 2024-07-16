import { Type, oneOf } from 'cmd-ts';
import { TOKENS } from 'planck-demo-interface/src/constants/tokens';

import { ChainIdentifier } from '@/consumers/Consumer';

export const BigIntType: Type<string, bigint> = {
  from: async (str) => BigInt(str),
};

export const coinType = oneOf(
  TOKENS.flatMap((v) => (v.chain !== ChainIdentifier.Sui ? [] : [v.symbol])),
);
