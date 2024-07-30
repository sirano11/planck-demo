export const PROTOCOL_PACKAGE_ID =
  '0xea2c04703460cf1fc4a0b320e30367ede5d568f5a19b4cdf8a7864832b7577bb';
export type ProtocolPackageId = typeof PROTOCOL_PACKAGE_ID;

export const PROTOCOL = {
  PACKAGE_ID: PROTOCOL_PACKAGE_ID,
  TARGET: {
    MARKET_SWAP: `${PROTOCOL_PACKAGE_ID}::market::swap`,
    MARKET_SWAP_BTC_TO_LMINT: `${PROTOCOL_PACKAGE_ID}::market::btc_to_lmint`,
    MARKET_SWAP_LMINT_TO_BTC: `${PROTOCOL_PACKAGE_ID}::market::lmint_to_btc`,
    MARKET_SIMULATE_SWAP: `${PROTOCOL_PACKAGE_ID}::market::simulate_swap`,
    MARKET_SIMULATE_BTC_TO_LMINT: `${PROTOCOL_PACKAGE_ID}::market::simulate_btc_to_lmint`,
    MARKET_SIMULATE_LMINT_TO_BTC: `${PROTOCOL_PACKAGE_ID}::market::simulate_lmint_to_btc`,
  },
  TYPE_ARGUMENT: {
    CASH_LIVRE: `${PROTOCOL_PACKAGE_ID}::cash_livre::CASH_LIVRE`,
    CASH_SDR: `${PROTOCOL_PACKAGE_ID}::cash_sdr::CASH_SDR`,
    CASH_KRW: `${PROTOCOL_PACKAGE_ID}::cash_krw::CASH_KRW`,
    CASH_JPY: `${PROTOCOL_PACKAGE_ID}::cash_jpy::CASH_JPY`,
    LIQUID_MINT: `${PROTOCOL_PACKAGE_ID}::liquid_mint::LIQUID_MINT`,
  },
  OBJECT_ID: {
    // basic_supply::BasicSupply
    SUPPLY_LIQUID_MINT: `0x4cb91e580ac9215495c31397a6a499b2bd91246dc451755eff0d16e9b2212527`,
    SUPPLY_LIVRE: `0x4aab2f38f5d4e71e84091c1309083b9af69787bf2a3e84a71176b026aef58acc`,
    SUPPLY_SDR: `0xf6cadc41b474e3e06c613b697575cf207a5a6ae6dd4fe91c9c70fbc9f833b9ee`,
    SUPPLY_KRW: `0x00e4f09d7e866c1606bf8ec7748e23a7cbbb81ebdd0b274c6d6cf245db0dd21e`,
    SUPPLY_JPY: `0x442bccc650c8d8144397ec828b7babd97c059c493b6c1004572bed9c1cb7071d`,

    // market::LiquidityPoolParam
    LIQUIDTY_POOL_PARAM: `0xc1eea933b0622b41899b25fd85bc3499496ea8140f4bcaa991a9f90524ed8e71`,

    // oracle::Oracle
    ORACLE: `0xa04b250ff765cf5b3a862c723ce63e84ba09a41f7f196333cf098d078391799a`,

    // pilgrim::Pilgrim
    PILGRIM: `0x8abb6f26b59b6b86c3a46cb3d13b0b8861475e2de8151578362e97f60a92348f`,

    // cash::SupportedCurrencies
    SUPPORTED_CURRENCIES: `0x07bcd5e5041d3ec1216c4bc526cbeeaca9dd45f62b5ac13bf354806aad3a6ed2`,
  },
};

export const CUSTODY_PACKAGE_ID =
  '0x3cf3865aae87afbf549b80702451f0b7f31295288ca12be429abc3ed580c5cff';

export const CUSTODY = {
  PACKAGE_ID: CUSTODY_PACKAGE_ID,
  TARGET: {
    BTC_MINT: `${CUSTODY_PACKAGE_ID}::btc::mint`,
  },
  OBJECT_ID: {
    // btc::Treasury
    BTC_TREASURY: `0xb7eb26210d9ad67c8cb2247db1bd06dc6df2f1ab0b444141d504f6521cfabc24`,
  },
};
