import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';

import { CUSTODY, PROTOCOL } from './config';
import {
  devInspectAndGetResults,
  mergeCoins,
  parseExecutionResults,
} from './utils';

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
      tx.object(toSupplyId),
      fromCoin,
      tx.object(PROTOCOL.OBJECT_ID.LIQUIDTY_POOL_PARAM),
      tx.object(PROTOCOL.OBJECT_ID.ORACLE),
      tx.object(SUI_CLOCK_OBJECT_ID),
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

  const btcCoins = [
    ...btcCoinIds.map((v) => tx.object(v)),
    ...(mintedBtcCoin ? [mintedBtcCoin] : []),
  ];

  if (btcCoins.length > 1) {
    tx.mergeCoins(btcCoins[0], btcCoins.slice(1));
  }

  const [btcCoin] = tx.splitCoins(btcCoins[0], [tx.pure.u64(btcAmount)]);

  const [outBtcCoin, outLmintCoin] = tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SWAP_BTC_TO_LMINT,
    arguments: [
      tx.object(PROTOCOL.OBJECT_ID.PILGRIM),
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_LIQUID_MINT),
      btcCoin,
      tx.pure.u64(minLmintOut),
    ],
  });
  tx.transferObjects([btcCoins[0], outBtcCoin, outLmintCoin], recipient);

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

  const btcCoins = [
    ...btcCoinIds.map((v) => tx.object(v)),
    ...(mintedBtcCoin ? [mintedBtcCoin] : []),
  ];

  if (btcCoins.length > 1) {
    tx.mergeCoins(btcCoins[0], btcCoins.slice(1));
  }

  const [btcCoin] = tx.splitCoins(btcCoins[0], [tx.pure.u64(btcAmount)]);

  const [outBtcCoin, outLmintCoin] = tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SWAP_BTC_TO_LMINT,
    arguments: [
      tx.object(PROTOCOL.OBJECT_ID.PILGRIM),
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_LIQUID_MINT),
      btcCoin,
      tx.pure.u64(0),
    ],
  });

  const [cashCoin] = tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SWAP,
    arguments: [
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_LIQUID_MINT),
      tx.object(toSupplyId),
      outLmintCoin,
      tx.object(PROTOCOL.OBJECT_ID.LIQUIDTY_POOL_PARAM),
      tx.object(PROTOCOL.OBJECT_ID.ORACLE),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
    typeArguments: [PROTOCOL.TYPE_ARGUMENT.LIQUID_MINT, toTypeArgument],
  });

  tx.transferObjects([btcCoins[0], outBtcCoin, cashCoin], recipient);

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
      tx.object(PROTOCOL.OBJECT_ID.SUPPLY_LIQUID_MINT),
      fromCoin,
      tx.object(PROTOCOL.OBJECT_ID.LIQUIDTY_POOL_PARAM),
      tx.object(PROTOCOL.OBJECT_ID.ORACLE),
      tx.object(SUI_CLOCK_OBJECT_ID),
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
    arguments: [
      tx.pure.u64(fromAmount),
      tx.object(PROTOCOL.OBJECT_ID.ORACLE),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
    typeArguments: [fromTypeArgument, toTypeArgument],
  });

  const results = await devInspectAndGetResults(client, tx);
  const [result] = parseExecutionResults<[string]>(results);

  return BigInt(result);
};

export const simulate_btc_to_lmint = async (
  client: SuiClient,
  btcAmount: bigint,
): Promise<bigint> => {
  const tx = new Transaction();
  tx.moveCall({
    target: PROTOCOL.TARGET.MARKET_SIMULATE_BTC_TO_LMINT,
    arguments: [tx.object(PROTOCOL.OBJECT_ID.PILGRIM), tx.pure.u64(btcAmount)],
  });

  const results = await devInspectAndGetResults(client, tx);
  const [result] = parseExecutionResults<[string]>(results);

  return BigInt(result);
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
      tx.pure.u64(lmintAmount),
    ],
  });

  const results = await devInspectAndGetResults(client, tx);
  const [result] = parseExecutionResults<[string]>(results);

  return BigInt(result);
};
