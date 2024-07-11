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
