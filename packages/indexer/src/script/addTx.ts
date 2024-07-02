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

const suiQueue = new Queue(QUEUE_NAME.SUI, {
  connection: QUEUE_CONFIG.connection,
  defaultJobOptions: QUEUE_CONFIG.defaultJobOptions,
});

const solanaQueue = new Queue(QUEUE_NAME.SOLANA, {
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
    sender: '0xaaaa',
    data: '0xabcdef',
  };

  const suiTx: Tx = {
    asset: { address: '0x1234', amount: BigNumber.from(1234) },
    chain: ChainIdentifier.Sui,
    sender: '0xaaaa',
    data: '0xabcdef',
  };

  await msgCommittedIndexer.mockHandle(solTx, '0x123456');
  await msgCommittedIndexer.mockHandle(suiTx, '0x876543');
};

main();
