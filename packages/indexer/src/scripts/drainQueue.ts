import { Queue } from 'bullmq';
import { command, oneOf, option, run } from 'cmd-ts';

import { QUEUE_CONFIG, QUEUE_NAME } from '@/config';

const app = command({
  name: 'drain-queue',
  args: {
    queueName: option({
      type: oneOf([QUEUE_NAME.Sui, QUEUE_NAME.Solana, 'all']),
      long: 'queue-name',
      defaultValue: () => 'all',
    }),
  },
  handler: async ({ queueName }) => {
    const queueNames =
      queueName === 'all' ? [QUEUE_NAME.Sui, QUEUE_NAME.Solana] : [queueName];

    for (const name of queueNames) {
      const queue = new Queue(name, QUEUE_CONFIG);
      await queue.drain();
      console.log(`[*] Queue "${name}" drained`);
    }
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
