export const PROTOCOL_PACKAGE_ID =
  '0x557aea726356aa99aee2f90454140cf9fab29281423c2f2087951afddf1464aa';
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
    SUPPLY_LIQUID_MINT: `0x32bdca0f713a9a459ecf03fa72742d617bf5e59b6ca3b048e2ed86452e68ec93`,
    SUPPLY_LIVRE: `0x6e37bb5960dceb3069ce7a2a8b591c2c2fbbd8a9cc3164be2050ce1ea55d8c97`,
    SUPPLY_SDR: `0x5fb5053345c3501720371defa54148335cc6127ba139fd80ec4607fb4f0cf8b7`,
    SUPPLY_KRW: `0xca4f011b58dd3f5b5a9fac3ac8c01256e4c5326a537a1e96fc4989aaf9f867e7`,
    SUPPLY_JPY: `0xd1d77df118d46e205cae548f930dd7efd5a8eced194ea3db82efccb6fca7fada`,

    // market::LiquidityPoolParam
    LIQUIDTY_POOL_PARAM: `0x7ef49479db8d54260e20576f0b59ca0350a3f8e17d1ce81993f98108dfa887b7`,

    // oracle::Oracle
    ORACLE: `0x7bece961c0422f11d1076d7714d8bd722b068ae89d9aafb70998d9871c078d07`,

    // pilgrim::Pilgrim
    PILGRIM: `0x730ea011390a915580442e921f2643fdb6c8a1a3be63b76bd07d8ae17f268910`,

    // cash::SupportedCurrencies
    SUPPORTED_CURRENCIES: `0x479e3825de2788108208c602adda481144289429489edd2dc09ea2cdd6624f11`,
  },
};

export const CUSTODY_PACKAGE_ID =
  '0xdb1f9f2475d3cdc9f6feb36a28fdadb09cc782a99481e13b76a38c3a9c0e0ffa';

export const CUSTODY = {
  PACKAGE_ID: CUSTODY_PACKAGE_ID,
  TARGET: {
    BTC_MINT: `${CUSTODY_PACKAGE_ID}::btc::mint`,
  },
  TYPE_ARGUMENT: {
    BTC: `${CUSTODY_PACKAGE_ID}::btc::BTC`,
  },
  OBJECT_ID: {
    // btc::Treasury
    BTC_TREASURY: `0xc5a9b2dd2ce3f246c0243bbf5237fcce334d806036fe20a713d32b0576d26254`,
  },
};
