import { toHEX } from '@mysten/bcs';
import { bcs } from '@mysten/sui.js/bcs';
import { SuiClient, SuiExecutionResult } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

import { PROTOCOL } from './config';

export const swap = async (
  fromSupplyId: string,
  toSupplyId: string,
  fromCoinId: string,
  fromTypeArgument: string,
  toTypeArgument: string,
  recipient: string,
): Promise<string> => {
  const tx = new Transaction();
  const [toCoin] = tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SWAP,
    arguments: [
      tx.object(fromSupplyId),
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_SDR),
      tx.object(toSupplyId),
      tx.object(fromCoinId),
      tx.object(PROTOCOL.OBJECT_ID.LIQUIDTY_POOL_PARAM),
      tx.object(PROTOCOL.OBJECT_ID.ORACLE),
    ],
    typeArguments: [fromTypeArgument, toTypeArgument],
  });
  tx.transferObjects([toCoin], recipient);

  const rawTxArr = await tx.build();
  return toHEX(rawTxArr);
};

export const lmint_to_btc = async (
  lmintCoinId: string,
  minBtcOut: number,
  recipient: string,
): Promise<string> => {
  const tx = new Transaction();
  const [btcCoin, lmintCoin] = tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SWAP_LMINT_TO_BTC,
    arguments: [
      tx.object(PROTOCOL.OBJECT_ID.PILGRIM),
      tx.object(PROTOCOL.OBJECT_ID.RESERVE_LIQUID_MINT),
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_LIQUID_MINT),
      tx.object(lmintCoinId),
      tx.pure.u64(minBtcOut),
    ],
  });
  tx.transferObjects([btcCoin, lmintCoin], recipient);

  const rawTxArr = await tx.build();
  return toHEX(rawTxArr);
};

export const btc_to_lmint = async (
  btcCoinId: string,
  minBtcOut: number,
  recipient: string,
): Promise<string> => {
  const tx = new Transaction();
  const [btcCoin, lmintCoin] = tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SWAP_BTC_TO_LMINT,
    arguments: [
      tx.object(PROTOCOL.OBJECT_ID.PILGRIM),
      tx.object(PROTOCOL.OBJECT_ID.RESERVE_LIQUID_MINT),
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_LIQUID_MINT),
      tx.object(btcCoinId),
      tx.pure.u64(minBtcOut),
    ],
  });
  tx.transferObjects([btcCoin, lmintCoin], recipient);

  const rawTxArr = await tx.build();
  return toHEX(rawTxArr);
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
  const result = results[0].returnValues?.[0][0];

  return result ? BigInt(bcs.u64().parse(new Uint8Array(result))) : 0n;
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
      tx.object(PROTOCOL.OBJECT_ID.RESERVE_LIQUID_MINT),
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
      tx.object(PROTOCOL.OBJECT_ID.RESERVE_LIQUID_MINT),
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
