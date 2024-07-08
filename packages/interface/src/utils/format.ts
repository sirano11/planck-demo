// default coin decimals
export const COIN_DECIMALS = 9;

export const nFormat = (num: number, digits: number = COIN_DECIMALS) => {
  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
  ];
  const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/;
  const item = lookup.findLast((item) => num >= item.value);
  return item
    ? (num / item.value).toFixed(digits).replace(regexp, '').concat(item.symbol)
    : '0';
};

export const formatRawAmount = (rawAmount: string): string => {
  if (!rawAmount) {
    return '0';
  }
  let dec = rawAmount.slice(-COIN_DECIMALS) || '0';
  while (dec.length > 1 && dec.endsWith('0')) {
    dec = dec.slice(0, -1);
  }

  const balance =
    parseInt(rawAmount.slice(0, -COIN_DECIMALS) || '0').toLocaleString('en') +
    (dec === '0' ? '' : '.' + dec.toString());
  return balance;
};

export const numberFromAtomics = (value: string, decimals: number = 9) =>
  Number(value.slice(0, -decimals) + '.' + value.slice(-decimals));

export const atomicsFromFloat = (value: number, decimals: number = 9) => {
  const str = value.toFixed(decimals);
  const [whole, fraction] = str.split('.');
  return BigInt(whole + (fraction || '').padEnd(decimals, '0'));
};

const getDateOrdinal = (d: number) => {
  if (d > 3 && d < 21) return 'th';
  switch (d % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};
export const formatWithDateOrdinal = (value: number | null) => {
  if (!value) {
    return '-';
  }
  return value.toLocaleString() + getDateOrdinal(value);
};
