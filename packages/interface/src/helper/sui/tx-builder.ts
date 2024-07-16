import { bcs } from '@mysten/sui.js/bcs';
import { SuiClient, SuiExecutionResult } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

import { CUSTODY, PROTOCOL } from './config';

const mergeCoins = (tx: Transaction, coinIds: string[]) =>
  coinIds.length > 2
    ? tx.mergeCoins(
        tx.object(coinIds[0]),
        coinIds.slice(1).map((v) => tx.object(v)),
      )[0]
    : tx.object(coinIds[0]);

export const swap = async (
  client: SuiClient,
  fromSupplyId: string,
  toSupplyId: string,
  fromCoinIds: string[],
  fromCoinAmount: bigint,
  fromTypeArgument: string,
  toTypeArgument: string,
  recipient: string,
): Promise<Uint8Array> => {
  const tx = new Transaction();

  const mergedFromCoin = mergeCoins(tx, fromCoinIds);

  const [fromCoin] = tx.splitCoins(mergedFromCoin, [
    tx.pure.u64(fromCoinAmount),
  ]);

  const [toCoin] = tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SWAP,
    arguments: [
      tx.object(fromSupplyId),
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_SDR),
      tx.object(toSupplyId),
      fromCoin,
      tx.object(PROTOCOL.OBJECT_ID.LIQUIDTY_POOL_PARAM),
      tx.object(PROTOCOL.OBJECT_ID.ORACLE),
    ],
    typeArguments: [fromTypeArgument, toTypeArgument],
  });
  tx.transferObjects([toCoin], recipient);

  return tx.build({ client, onlyTransactionKind: true });
};

export const lmint_to_btc = async (
  client: SuiClient,
  lmintCoinIds: string[],
  lmintAmount: bigint,
  minBtcOut: bigint,
  recipient: string,
): Promise<Uint8Array> => {
  const tx = new Transaction();

  const mergedLmintCoin = mergeCoins(tx, lmintCoinIds);

  const [lmintCoin] = tx.splitCoins(mergedLmintCoin, [
    tx.pure.u64(lmintAmount),
  ]);

  const [outBtcCoin, outLmintCoin] = tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SWAP_LMINT_TO_BTC,
    arguments: [
      tx.object(PROTOCOL.OBJECT_ID.PILGRIM),
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_LIQUID_MINT),
      lmintCoin,
      tx.pure.u64(minBtcOut),
    ],
  });
  tx.transferObjects([outBtcCoin, outLmintCoin], recipient);

  return tx.build({ client, onlyTransactionKind: true });
};

export const btc_to_lmint = async (
  client: SuiClient,
  btcCoinIds: string[],
  btcCoinTotal: bigint,
  btcAmount: bigint,
  minLmintOut: bigint,
  recipient: string,
): Promise<Uint8Array> => {
  const tx = new Transaction();

  const mintedBtcCoin =
    btcAmount > btcCoinTotal
      ? tx.moveCall({
          target: CUSTODY.TARGET.BTC_MINT,
          arguments: [
            tx.object(CUSTODY.OBJECT_ID.BTC_TREASURY),
            tx.pure.u64(btcAmount - btcCoinTotal),
          ],
        })[0]
      : null;

  const [mergedBtcCoin] = tx.mergeCoins(tx.object(btcCoinIds[0]), [
    ...btcCoinIds.slice(1).map((v) => tx.object(v)),
    ...(mintedBtcCoin ? [mintedBtcCoin] : []),
  ]);

  const [btcCoin] = tx.splitCoins(mergedBtcCoin, [tx.pure.u64(btcAmount)]);

  const [outBtcCoin, outLmintCoin] = tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SWAP_BTC_TO_LMINT,
    arguments: [
      tx.object(PROTOCOL.OBJECT_ID.PILGRIM),
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_LIQUID_MINT),
      btcCoin,
      tx.pure.u64(minLmintOut),
    ],
  });
  tx.transferObjects([outBtcCoin, outLmintCoin], recipient);

  return tx.build({ client, onlyTransactionKind: true });
};

export const btc_to_cash = async (
  client: SuiClient,
  btcCoinIds: string[],
  btcCoinTotal: bigint,
  btcAmount: bigint,
  toSupplyId: string,
  toTypeArgument: string,
  recipient: string,
): Promise<Uint8Array> => {
  const tx = new Transaction();

  const mintedBtcCoin =
    btcAmount > btcCoinTotal
      ? tx.moveCall({
          target: CUSTODY.TARGET.BTC_MINT,
          arguments: [
            tx.object(CUSTODY.OBJECT_ID.BTC_TREASURY),
            tx.pure.u64(btcAmount - btcCoinTotal),
          ],
        })[0]
      : null;

  const [mergedBtcCoin] = tx.mergeCoins(tx.object(btcCoinIds[0]), [
    ...btcCoinIds.slice(1).map((v) => tx.object(v)),
    ...(mintedBtcCoin ? [mintedBtcCoin] : []),
  ]);

  const [btcCoin] = tx.splitCoins(mergedBtcCoin, [tx.pure.u64(btcAmount)]);

  const [outBtcCoin, outLmintCoin] = tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SWAP_BTC_TO_LMINT,
    arguments: [
      tx.object(PROTOCOL.OBJECT_ID.PILGRIM),
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_LIQUID_MINT),
      btcCoin,
      tx.pure.u64(0),
    ],
  });
  tx.transferObjects([outBtcCoin], recipient);

  const [cashCoin] = tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SWAP,
    arguments: [
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_LIQUID_MINT),
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_SDR),
      tx.object(toSupplyId),
      outLmintCoin,
      tx.object(PROTOCOL.OBJECT_ID.LIQUIDTY_POOL_PARAM),
      tx.object(PROTOCOL.OBJECT_ID.ORACLE),
    ],
    typeArguments: [PROTOCOL.TYPE_ARGUMENT.LIQUID_MINT, toTypeArgument],
  });
  tx.transferObjects([cashCoin], recipient);

  return tx.build({ client, onlyTransactionKind: true });
};

export const cash_to_btc = async (
  client: SuiClient,
  fromCoinIds: string[],
  fromCoinAmount: bigint,
  fromSupplyId: string,
  fromTypeArgument: string,
  recipient: string,
): Promise<Uint8Array> => {
  const tx = new Transaction();

  const mergedFromCoin = mergeCoins(tx, fromCoinIds);

  const [fromCoin] = tx.splitCoins(mergedFromCoin, [
    tx.pure.u64(fromCoinAmount),
  ]);

  const [lmintCoin] = tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SWAP,
    arguments: [
      tx.object(fromSupplyId),
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_SDR),
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_LIQUID_MINT),
      fromCoin,
      tx.object(PROTOCOL.OBJECT_ID.LIQUIDTY_POOL_PARAM),
      tx.object(PROTOCOL.OBJECT_ID.ORACLE),
    ],
    typeArguments: [fromTypeArgument, PROTOCOL.TYPE_ARGUMENT.LIQUID_MINT],
  });
  tx.transferObjects([lmintCoin], recipient);

  const [btcCoin] = tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SWAP_LMINT_TO_BTC,
    arguments: [
      tx.object(PROTOCOL.OBJECT_ID.PILGRIM),
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_LIQUID_MINT),
      lmintCoin,
      tx.pure.u64(0),
    ],
  });
  tx.transferObjects([btcCoin], recipient);

  return tx.build({ client, onlyTransactionKind: true });
};

export const simulate_swap = async (
  client: SuiClient,
  fromAmount: bigint,
  fromTypeArgument: string,
  toTypeArgument: string,
): Promise<bigint> => {
  const tx = new Transaction();
  tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SIMULATE_SWAP,
    arguments: [tx.pure.u64(fromAmount), tx.object(PROTOCOL.OBJECT_ID.ORACLE)],
    typeArguments: [fromTypeArgument, toTypeArgument],
  });

  const results = await devInspectAndGetResults(client, tx);
  const [result] = parseExecutionResults<[bigint]>(results);

  return result;
};

export const simulate_btc_to_lmint = async (
  client: SuiClient,
  btcAmount: bigint,
): Promise<bigint> => {
  const tx = new Transaction();
  tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SIMULATE_BTC_TO_LMINT,
    arguments: [
      tx.object(PROTOCOL.OBJECT_ID.PILGRIM),
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_LIQUID_MINT),
      tx.pure.u64(btcAmount),
    ],
  });

  const results = await devInspectAndGetResults(client, tx);
  const [result] = parseExecutionResults<[bigint]>(results);

  return result;
};

export const simulate_lmint_to_btc = async (
  client: SuiClient,
  lmintAmount: bigint,
): Promise<bigint> => {
  const tx = new Transaction();
  tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SIMULATE_LMINT_TO_BTC,
    arguments: [
      tx.object(PROTOCOL.OBJECT_ID.PILGRIM),
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_LIQUID_MINT),
      tx.pure.u64(lmintAmount),
    ],
  });

  const results = await devInspectAndGetResults(client, tx);
  const [result] = parseExecutionResults<[bigint]>(results);

  return result;
};

// https://github.com/juzybits/polymedia-suitcase/blob/7f4e3c563332957c75f9d77b735e8c72f6d91706/src/core/src/utils-sui.ts#L13
async function devInspectAndGetResults(
  suiClient: SuiClient,
  tx: Transaction,
  sender = '0x7777777777777777777777777777777777777777777777777777777777777777',
): Promise<SuiExecutionResult[]> {
  const resp = await suiClient.devInspectTransactionBlock({
    sender: sender,
    transactionBlock: tx,
  });
  if (resp.error) {
    throw Error(`response error: ${JSON.stringify(resp, null, 2)}`);
  }
  if (!resp.results?.length) {
    throw Error(`response has no results: ${JSON.stringify(resp, null, 2)}`);
  }
  return resp.results;
}

// Based on https://github.com/naviprotocol/navi-sdk/blob/387ab3b6dbc8aa1cedcf6cf239c53e161964c3e1/src/libs/CallFunctions/index.ts#L13
export const parseExecutionResults = <ReturnType extends any[]>(
  results: SuiExecutionResult[],
  parseType?: string,
) => {
  if (results[0].returnValues && results[0].returnValues.length > 0) {
    let values: any[] = [];
    for (let v of results[0].returnValues) {
      const _type = parseType ? parseType : v[1];
      let result = bcs.de(_type, Uint8Array.from(v[0]));
      values.push(result);
    }
    return values as ReturnType;
  }
  throw new Error(
    `Failed to parse \`SuiExecutionResult[]\`: ${JSON.stringify(results)}`,
  );
};
