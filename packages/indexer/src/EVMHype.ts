import { flushBatchPersistenceItems } from '@therne/hype/lib/extensions/persistence';
import { log } from '@therne/hype/lib/logger';
import { TypedEmitter } from 'tiny-typed-emitter';

import { EVMBlock } from './EVMBlock';
import { EVMBlockDataSource } from './EVMMultipleBlockPoller';

type Block = EVMBlock;

export type SubscriberFn = (block: Block, subscriptionId: string) => Promise<void>;

interface HypeEvents {
  block: (block: Block) => void;
  postBlock: (block: Block) => void;
  callSubscriber: (subscriptionId: string, block: Block) => void;
  postCallSubscriber: (subscriptionId: string, block: Block) => void;
  error: (err: Error, subscriptionId: string, block: Block) => void;
  finish: () => void;
}

export class EVMHype extends TypedEmitter<HypeEvents> {
  public subscriptions: { [id: string]: SubscriberFn } = {};

  constructor(public dataSource: EVMBlockDataSource) {
    super();

    this.on('block', (block) => {
      log('trace', 'hype', 'processing block', {
        height: block.height,
        blockTimestamp: block.timestamp.toISOString(),
      });
    });
    this.on('error', (err, subscriptionId, block) => {
      log('error', subscriptionId, 'error', {
        height: block.height,
        blockTimestamp: block.timestamp.toISOString(),
        error: err.stack,
      });
    });

    // flush persistence items
    this.on('finish', () => flushBatchPersistenceItems());
  }

  subscribe(id: string, subscription: SubscriberFn): EVMHype {
    this.subscriptions[id] = subscription;
    return this;
  }

  unsubscribe(id: string): void {
    if (!this.subscriptions[id]) {
      throw new Error(`subscription '${id}' is not found`);
    }
    delete this.subscriptions[id];
  }

  async start(): Promise<void> {
    for await (const block of this.dataSource.blocks()) {
      this.emit('block', block);

      await Promise.all(
        Object.entries(this.subscriptions).map(async ([id, subscriber]) => {
          try {
            this.emit('callSubscriber', id, block);
            await subscriber(block, id);
            this.emit('postCallSubscriber', id, block);
          } catch (err) {
            this.emit('error', err as Error, id, block);
          }
        }),
      );

      this.emit('postBlock', block);
    }
    this.emit('finish');
  }
}
