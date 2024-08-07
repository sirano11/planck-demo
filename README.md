# Planck Demo

## Getting Started

### Prerequisites

- Node.js
- Yarn
- Docker and Docker Compose

### Clone the repository

```bash
git clone https://github.com/your-username/planck-demo.git
cd planck-demo
```

### Install dependencies

In the root directory of the project (where the `yarn.lock` file is located), run:

```bash
yarn install
```

### Register your account

To subscribe to events and commit your transactions through the Hub contract on the Ethereum network, you need to register your secret in Redis.

In the file `./packages/indexer/src/scripts/addSenderInfo.ts`, modify the mnemonic string to generate new accounts for use in Planck Demo.

```ts
const mnemonics: string[] = [
  'penalty frog guide equal virus grant airport boost inside way pond wisdom catalog poet question',
];
```

And then, run `addSenderInfo.ts`

```bash
yarn tsx ./addSenderInfo.ts
# or
yarn workspace planck-demo-indexer add-sender
```

if you forget this step, you might see this error in a toast message:

> Actor wallet not registered

### Mint wBTC and wSOL

Before you enjoy Planck Demo, you need to have wBTC and wSOL available on the Ethereum network.

You can find the addresses of wBTC and wSOL used by Planck Demo in the file `./interface/src/helper/eth/config.ts`.

Mint it!:

```bash
# wBTC
yarn workspace planck-demo-contracts faucet --token-address 0x7daEE33986AC827989bb32F9962d5E54080CC859 --user-address 0x{yourEOA} --amount 1000000000000 --network sepolia

# wSOL
yarn workspace planck-demo-contracts faucet --token-address 0x4cECeB128754faAB57315C12346b8f3F4E2ABEb5 --user-address 0x{yourEOA} --amount 1000000000000 --network sepolia
```

## Run with Docker compose

In the root of this project, you can find `docker-compose.yml`.
Open the new terminal and run:

```bash
docker compose up
```

If you want to test with only your own account, you need to set the `ALLOWED_SENDER` environment variable in the `indexer` container.  
If not set, the `indexer` will try to catch events of all accounts that registerd in Redis:

```
  - .....
  - ALLOWED_SENDER=0x{ethereum address}
```

## See the log of specfic container

You can watch the logs of a specific container through the command below:

```bash
# To watch indexer log
docker logs indexer -f

# To watch indexer_sui_consumer
docker logs indexer_sui_consumer -f
```

## Demo Web Page

The planck-demo-interface is a web server to render planck-demo page. To run planck-demo locally, you also need to run planck-demo-interface.

### Environment variables

First, set the environment variables in the `.env` file located in the root directory of the `interface` package (`packages/interface/.env`):

```bash
# The socket server that emit events while processing transaction
NEXT_PUBLIC_INDEXER_URL=http://localhost:1233

# The redis server
REDIS_URL=redis://localhost:6379

```

### Web server

Run planck-demo-interface:

```
yarn workspace planck-demo-interface dev
```
