// FIXME: Replace with actual package id
export const PACKAGE_ID = '';

export const PROTOCOL = {
  PACKAGE_ID,
  TARGET: {
    MARKET_SWAP: `${PACKAGE_ID}::market::swap`,
    MARKET_SWAP_BTC_TO_LMINT: `${PACKAGE_ID}::market::btc_to_lmint`,
    MARKET_SWAP_LMINT_TO_BTC: `${PACKAGE_ID}::market::lmint_to_btc`,
    MARKET_SIMULATE_SWAP: `${PACKAGE_ID}::market::simulate_swap`,
    MARKET_SIMULATE_BTC_TO_LMINT: `${PACKAGE_ID}::market::simulate_btc_to_lmint`,
    MARKET_SIMULATE_LMINT_TO_BTC: `${PACKAGE_ID}::market::simulate_lmint_to_btc`,
  },
  TYPE_ARGUMENT: {
    CASH_LIVRE: `${PACKAGE_ID}::cash_livre::CASH_LIVRE`,
    CASH_SDR: `${PACKAGE_ID}::cash_sdr::CASH_SDR`,
    CASH_KRW: `${PACKAGE_ID}::cash_krw::CASH_KRW`,
    CASH_JPY: `${PACKAGE_ID}::cash_jpy::CASH_JPY`,
    LIQUID_MINT: `${PACKAGE_ID}::liquid_mint::LIQUID_MINT`,
  },
  OBJECT_ID: {
    SUPPLY_LIQUID_MINT: ``,
    SUPPLY_LIVRE: ``,
    SUPPLY_SDR: ``,
    SUPPLY_KRW: ``,
    SUPPLY_JPY: ``,
    LIQUIDTY_POOL_PARAM: ``,
    ORACLE: ``,
    PILGRIM: ``,
    RESERVE_LIQUID_MINT: ``,
  },
};
