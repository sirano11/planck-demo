# Planck Demo

## Prerequisites

### Install dependencies.

In your root folder or planck-demo, just run the below command.

```
yarn install
```

### Register your account

To subscribe and handle your transaction through Hub contract in Ethereum network, It needs to register your secret in redis.

In `./planck-demo/packages/indexer/src/scripts/addSenderInfo.ts`, you need to modify the mnemonic string to register account that used planck-demo.

```
const mnemonics: string[] = [
  'penalty frog guide equal virus grant airport boost inside way pond wisdom catalog poet question',
];
```

And then, it run `addSenderInfo.ts`

```
yarn tsx ./addSenderInfo.ts
//or
yarn workspace planck-demo-indexer add-sender
```

### Mint wBTC and wSOL

Before you enjoy the planck-demo, you needs to have wBTC and wSOL existed in Ethereum.
You can find the addresses of wBTC, wSOL that used by planck-demo through `planck-demo/interface/src/helper/eth/config.ts`

Mint it.

```
// wBTC
yarn workspace planck-demo-contracts faucet --token-address 0x7daEE33986AC827989bb32F9962d5E54080CC859 --user-address 0x{yourEOA} --amount 1000000000000 --network sepolia

// wSOL
yarn workspace planck-demo-contracts faucet --token-address 0x4cECeB128754faAB57315C12346b8f3F4E2ABEb5 --user-address 0x{yourEOA} --amount 1000000000000 --network sepolia
```

## Run with Docker compose

In your root of this project, you can find `docker-compose.yml`.
You just open terminal and run below command:

```
docker compose up
```

If you would test only your owned account, it needs to set `ALLOWED_SENDER` environment variable in `indexer` container. If not set, the indexer will try to catch all accounts that registerd in redis.

```
  - .....
  - ALLOWED_SENDER=0x{ethereum address}
```

## See the log of specfic container

You can watch the log specfic container through below command.

```
// To watch indexer log
docker logs indexer -f

// To watch indexer_sui_consumer
docker logs indexer_sui_consumer -f
```

## planck-demo-interface

The planck-demo-interface is a web server to render planck-demo page. To run planck-demo locally, it also needs to run planck-demo-interface.

### set .env

First, it needs to set environment variable in `.env`.

```
NEXT_PUBLIC_INDEXER_URL=http://localhost:1233 // The socket server that emit events while processing transaction
REDIS_URL=redis://localhost:6379 // The redis server
```

### Run planck-demo-interface

```
yarn workspace planck-demo-interface dev
```
