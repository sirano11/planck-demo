import { Queue } from 'bullmq';
import { BigNumber } from 'ethers';
import findWorkspaceRoot from 'find-yarn-workspace-root';
import path from 'path';

import { Config, QUEUE_CONFIG, QUEUE_NAME } from '@/config';
import { ChainIdentifier, Tx } from '@/consumers/Consumer';
import MsgCommittedIndexer from '@/indexers/MsgCommittedIndexer';
import { saveLastSyncedHeightInJSON } from '@/repository';

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

const main = async (): Promise<void> => {
  const startHeight = Config.START_HEIGHT;

  const repository = saveLastSyncedHeightInJSON(startHeight, CACHE_FILE_PATH);

  const msgCommittedIndexer = new MsgCommittedIndexer(
    repository.save,
    suiQueue,
    solanaQueue,
  );

  const solTx: Tx = {
    asset: { address: '0x1234', amount: BigNumber.from(1234) },
    chain: ChainIdentifier.Solana,
    sender: '0x80950530FfA47D5F56bcA3C1506e3bE98d625A9f',
    data: '0xabcdef',
  };

  const suiTx: Tx = {
    asset: { address: '0x1234', amount: BigNumber.from(1234) },
    chain: ChainIdentifier.Sui,
    sender: '0xD87C87a0D1eE4BC4896e808788691545Ba284CF8',
    data: '0xabcdef',
  };

  const suiTxUnregistedAddr: Tx = {
    asset: { address: '0x1234', amount: BigNumber.from(1234) },
    chain: ChainIdentifier.Sui,
    sender: '0xabcdefabcdef',
    data: '0xabcdef',
  };

  await msgCommittedIndexer.mockHandle(solTx, '0x123456');
  await msgCommittedIndexer.mockHandle(suiTx, '0x87651143');
  await msgCommittedIndexer.mockHandle(suiTxUnregistedAddr, '0x87622251143');
};

main();
