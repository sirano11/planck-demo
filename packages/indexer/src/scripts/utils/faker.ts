// https://github.com/faker-js/faker/blob/8a35e7092587aa236b5f759cfff34fc6318ebf60/src/modules/string/index.ts#L470
type HexadecimalOptions = {
  length: number;
  casing?: 'upper' | 'lower';
};
const hexadecimal = ({
  length,
  casing = 'lower',
}: HexadecimalOptions): string => {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }

  if (casing === 'upper') {
    result = result.toUpperCase();
  } else if (casing === 'lower') {
    result = result.toLowerCase();
  }

  return result;
};

export const Faker = {
  // https://github.com/faker-js/faker/blob/7c7f78da/src/modules/finance/index.ts#L997
  ethereumAddress: (): string => {
    const address = hexadecimal({ length: 40 });
    return address;
  },
  txHash: (): string => {
    const hash = hexadecimal({ length: 64 });
    return hash;
  },
};
