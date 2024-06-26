import findWorkspaceRoot from 'find-yarn-workspace-root';
import path from 'path';
import Web3 from 'web3';

import { EVMBlock } from './EVMBlock';
import { EVMHype } from './EVMHype';
import { EVMMultipleBlockPoller } from './EVMMultipleBlockPoller';
import { EVMMultipleBlocksFetcher } from './EVMMultipleBlocksFetcher';
import { Config } from './config';
import IndexerBase from './indexers/IndexerBase';
import MsgCommittedIndexer, {
  MsgCommittedEvent,
} from './indexers/MsgCommittedIndexer';
import { saveLastSyncedHeightInJSON } from './repository';
import { ParsedEvent, parseEventPrototype } from './util';

export type IndexerDependencies = {
  repositories: {};
  prefixes: { account: string };
  network: {
    chainId: string;
    endpoint: { lcd: string; rpc: string };
  };
};

const YARN_WORKSPACE_ROOT = findWorkspaceRoot() || '';
const CACHE_FILE_PATH = path.join(
  YARN_WORKSPACE_ROOT,
  'packages',
  'indexer',
  'data',
  'cache.json',
);

const msgCommittedEvent = parseEventPrototype<MsgCommittedEvent>(`MsgCommitted(
  address asset,
  uint256 amount,
  ChainIdentifier indexed chain,
  address indexed sender,
  bytes32 indexed actor,
  bytes data
)`);

const getSubscriberFn =
  <T extends object>(
    web3: Web3,
    contractAddress: string,
    event: ParsedEvent<T>,
    indexer: IndexerBase<T>,
  ) =>
  async (block: EVMBlock) => {
    let events = [];
    for (const txn of block.transactions) {
      if (txn.to !== contractAddress) continue;

      const receipt = await web3.eth.getTransactionReceipt(txn.hash);

      if (receipt.logs.length === 0) continue;

      for (const log of receipt.logs) {
        if (!log.topics || !log.data) continue;
        if (log.topics.length === 0) continue;

        if (log.topics[0] === event.signature) {
          events.push({
            ...event.decode(web3, log.data, log.topics),
            hash: txn.hash,
          });
        }
      }
    }
    await indexer.handle(events, block.timestamp);
  };

const main = async (): Promise<void> => {
  console.log({ ...Config, CACHE_FILE_PATH });

  const web3 = new Web3(Config.RPC_ENDPOINT);

  const blockFetcher = new EVMMultipleBlocksFetcher(web3);
  const startHeight = Config.START_HEIGHT;

  const blockPoller = new EVMMultipleBlockPoller(
    blockFetcher,
    saveLastSyncedHeightInJSON(startHeight, CACHE_FILE_PATH),
  );
  const hype = new EVMHype(blockPoller);

  const msgCommittedIndexer = new MsgCommittedIndexer();

  hype.subscribe(
    'msgCommitted',
    getSubscriberFn(
      web3,
      Config.CONTRACT_ADDRESS_HUB,
      msgCommittedEvent,
      msgCommittedIndexer,
    ),
  );

  return hype.start();
};

main()
  .then(() => console.log('✨ Done'))
  .catch(console.error);
