# CoMakery Ethereum

## Prerequisites

```sh
npm install
```

Recommended: run testrpc server for dev and test (fast):

```sh
npm run testrpc  # run in separate window
```

## Run tests

```sh
npm test
```

## Deploy

```sh
npm run truffle deploy
```

This will tell you your contract address.

## Dev server

This starts an express server which receives simple calls and executes contract calls:

```sh
npm run dev:server  # run in separate window
```

Then you should be able to transfer funds:

```sh
curl -H "Content-Type: application/json" -X POST \
  --data '{"contractAddress":"0x...", "recipient":"0x...", "amount":"100"}' \
  http://127.0.0.1:3906/transfer
```
