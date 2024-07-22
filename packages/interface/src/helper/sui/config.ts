export const PROTOCOL_PACKAGE_ID =
  '0x61a5432a5cd45364f1de98dca618938db14107e1771e0d612bbec4e1959242e1';

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
    SUPPLY_LIQUID_MINT: `0xf73b8b3844b433aca7b76187e58ea8a60b3165751d686a23a787e583098b6d99`,
    SUPPLY_LIVRE: `0x6a4fcbbfe2e205860e997496557a9817ba5cacb8999c66d2262b76d0f5f2a1da`,
    SUPPLY_SDR: `0x7cf75a75b6e20eb0a466dc97c036fde5eacfecf731d174b804449226edf37ba8`,
    SUPPLY_KRW: `0xb951743470d0a67c32d28e414b8bf0bf23fbe8dc4126192276d364acbae7887c`,
    SUPPLY_JPY: `0xd342541dd5a621e9a91c92c452a442aed19de337ab224219a7b17be8bfe0643b`,

    // market::LiquidityPoolParam
    LIQUIDTY_POOL_PARAM: `0xca0cb7eede208a81a3d9e832a141aea769bba107211dc01cc916f2acfa634db2`,

    // oracle::Oracle
    ORACLE: `0xaebf13bf9f9d568025268757aa5d5d60a97e0a65ea3e8517086e3c0f579cc030`,

    // pilgrim::Pilgrim
    PILGRIM: `0x9f2b00a8e2ea510e121b41ba7bac80291c6677f2522dd76e7cde219e82c06826`,

    // cash::SupportedCurrencies
    SUPPORTED_CURRENCIES: `0x798ecd8edb505b495b9ca2b7dff51269f9d14e07f8af99d5439ecf47ce384c05`,
  },
};

export const CUSTODY_PACKAGE_ID =
  '0xcd1e682e4b7c3a517832d8c6ba5d1e467e19ca73951a8c0ad3010440756d9318';

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
    BTC_TREASURY: `0x7e7d7fb6d074754715a2493fcca6d3ef5aa031afa59cd2d2be7add505d362796`,
  },
};
