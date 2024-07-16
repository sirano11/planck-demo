import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Queue } from 'bullmq';
import { command, option, positional, run, string } from 'cmd-ts';
import { BigNumber } from 'ethers';
import findWorkspaceRoot from 'find-yarn-workspace-root';
import path from 'path';
import { TOKENS, Token } from 'planck-demo-interface/src/constants/tokens';
import * as HubTransactionBuilder from 'planck-demo-interface/src/helper/eth/hub-builder';
import * as SuiTransactionBuilder from 'planck-demo-interface/src/helper/sui/tx-builder';
import { getCoinObject } from 'planck-demo-interface/src/helper/sui/utils';

import { Config, QUEUE_CONFIG, QUEUE_NAME } from '@/config';
import { ChainIdentifier, Tx } from '@/consumers/Consumer';
import MsgCommittedIndexer from '@/indexers/MsgCommittedIndexer';
import { saveLastSyncedHeightInJSON } from '@/repository';

import { BigIntType, coinType } from './utils/cmd-ts-types';
import { Faker } from './utils/faker';

const YARN_WORKSPACE_ROOT = findWorkspaceRoot() || '';
const CACHE_FILE_PATH = path.join(
  YARN_WORKSPACE_ROOT,
  'packages',
  'indexer',
  'data',
  'cache.json',
);

const suiQueue = new Queue(QUEUE_NAME.Sui, {
  connection: QUEUE_CONFIG.connection,
  defaultJobOptions: QUEUE_CONFIG.defaultJobOptions,
});

const solanaQueue = new Queue(QUEUE_NAME.Solana, {
  connection: QUEUE_CONFIG.connection,
  defaultJobOptions: QUEUE_CONFIG.defaultJobOptions,
});

const app = command({
  name: 'add-tx',
  args: {
    actorAddress: positional({ type: string, displayName: 'actor address' }),
    offer: option({
      type: coinType,
      long: 'offer',
      defaultValue: () => 'wBTC',
    }),
    ask: option({
      type: coinType,
      long: 'ask',
      defaultValue: () => 'MINT',
    }),
    amount: option({
      type: BigIntType,
      long: 'amount',
      defaultValue: () => 10000n,
    }),
  },
  handler: async ({ actorAddress, offer, ask, amount }) => {
    const startHeight = Config.START_HEIGHT;
    const repository = saveLastSyncedHeightInJSON(startHeight, CACHE_FILE_PATH);
    const msgCommittedIndexer = new MsgCommittedIndexer(
      repository.save,
      suiQueue,
      solanaQueue,
    );

    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const offerCoin: Token = TOKENS.find((v) => v.symbol === offer)!;
    const askCoin: Token = TOKENS.find((v) => v.symbol === ask)!;

    let rawTx: Uint8Array;

    if (offer === 'wBTC' && ask === 'MINT') {
      const { coinObjectIds, coinTotal } = await getCoinObject({
        client,
        coinType: offerCoin.typeArgument!,
        actorAddress,
      });

      rawTx = await SuiTransactionBuilder.btc_to_lmint(
        client,
        coinObjectIds,
        coinTotal,
        amount,
        0n, // minLmintOut
        actorAddress,
      );
    } else if (offer === 'wBTC' && ask.startsWith('cash')) {
      const { coinObjectIds, coinTotal } = await getCoinObject({
        client,
        coinType: offerCoin.typeArgument!,
        actorAddress,
      });

      rawTx = await SuiTransactionBuilder.btc_to_cash(
        client,
        coinObjectIds,
        coinTotal,
        amount,
        askCoin.supplyId!,
        askCoin.typeArgument!,
        actorAddress,
      );
    } else {
      throw new Error('Unsupported pair');
    }

    const suiTx: Tx = {
      asset: {
        address: offerCoin.address,
        amount: BigNumber.from(amount),
      },
      chain: ChainIdentifier.Sui,
      sender: Faker.ethereumAddress(),
      data: HubTransactionBuilder.encodeRawTx(rawTx),
    };
    const handle = [suiTx, Faker.txHash()] as const;

    console.log(handle);
    await msgCommittedIndexer.mockHandle(...handle);
  },
});

run(app, process.argv.slice(2))
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
