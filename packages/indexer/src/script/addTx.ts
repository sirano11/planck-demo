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

  const suiTx: Tx = {
    asset: { address: '0x1234', amount: BigNumber.from(1234) },
    chain: ChainIdentifier.Sui,
    sender: '0xD87C87a0D1eE4BC4896e808788691545Ba284CF8',
    data: '000301018f6f516357fa46455baf9f1827764e60d156b062016740939895b0174212c34e40b712000000000001000800ca9a3b0000000000207a866724ad74ab439e10664f65398fa23d8490f7f1715d613c8d6a1796a63af50200388ddbe9c72136a9cbd86c628fa3034c5be9da576efd1f0cfa820ea76fe42a6303627463046d696e74000201000001010001010300000000010200',
  };

  await msgCommittedIndexer.mockHandle(suiTx, '0x87651143');
};

main();
