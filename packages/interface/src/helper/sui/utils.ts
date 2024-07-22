import { bcs } from '@mysten/sui.js/bcs';
import { CoinStruct, SuiClient, SuiExecutionResult } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

export const mergeCoins = (tx: Transaction, coinIds: string[]) => {
  if (coinIds.length === 0) {
    throw new Error('coinIds must not be empty');
  }

  if (coinIds.length === 1) {
    return tx.object(coinIds[0]);
  }

  tx.mergeCoins(
    tx.object(coinIds[0]),
    coinIds.slice(1).map((v) => tx.object(v)),
  );

  return tx.object(coinIds[0]);
};

export type GetCoinObjectOptions = {
  client: SuiClient;
  actorAddress: string;
  coinType: string;
};
export const getCoinObject = async ({
  client,
  coinType,
  actorAddress,
}: GetCoinObjectOptions) => {
  let lastCursor: string | null | undefined;
  let coins: CoinStruct[] = [];
  let coinTotal = 0n;
  do {
    const { data, hasNextPage, nextCursor } = await client.getCoins({
      owner: actorAddress,
      cursor: lastCursor,
      coinType,
    });

    coins = [...coins, ...data];
    coinTotal += data.reduce((acc, v) => acc + BigInt(v.balance), 0n);

    lastCursor = hasNextPage ? nextCursor : undefined;
  } while (lastCursor);

  return {
    coins,
    coinTotal,
    coinObjectIds: coins.map((v) => v.coinObjectId),
  };
};

// https://github.com/juzybits/polymedia-suitcase/blob/7f4e3c563332957c75f9d77b735e8c72f6d91706/src/core/src/utils-sui.ts#L13
export const devInspectAndGetResults = async (
  suiClient: SuiClient,
  tx: Transaction,
  sender = '0x7777777777777777777777777777777777777777777777777777777777777777',
): Promise<SuiExecutionResult[]> => {
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
};

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
