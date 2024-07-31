# Planck Demo

## Prerequisites

First, you need to register account that used planck-demo.

In `./planck-demo/packages/indexer/src/scripts/addSenderInfo.ts`, you need to modify the mnemonic string to register account that used planck-demo.

```
const mnemonics: string[] = [
  'penalty frog guide equal virus grant airport boost inside way pond wisdom catalog poet question',
];
```

## Run with Docker compose

You just open terminal and run below command:

```
docker compose up
```

If you would test only your owned account, it needs to set `ALLOWED_SENDER` environment variable in `indexer` container. If not set, the indexer will try to catch all accounts that registerd in redis.

```
  - .....
  - ALLOWED_SENDER=0x{address}
```
