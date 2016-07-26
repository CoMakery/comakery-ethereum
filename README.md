STATUS: This is BETA software. Use it with caution. Please send us feedback using [github issues](https://github.com/CoMakery/comakery-ethereum/issues) and code contributions using [pull requests](https://github.com/CoMakery/comakery-ethereum/pulls).

# CoMakery Ethereum

CoMakery Ethereum helps you create and administer collaborative token based projects. It consists of [Ethereum](https://www.ethereum.org/) Smart Contracts, blockchain deployment scripts, and a Node REST API server using the [Truffle](https://github.com/ConsenSys/truffle) Javascript framework. The smart contracts deployed can be used by talking to the CoMakery Ethereum node server, through an Ethereum Wallet, through your own software which communicates with an Ethereum node via RPC, or through the [CoMakery.com](http://www.comakery.com) site.

The [DynamicToken](https://github.com/CoMakery/comakery-ethereum/blob/master/contracts/DynamicToken.sol) smart contract conforms to the Ethereum Solidity [ERC 20 Standard Token interface](https://github.com/ethereum/EIPs/issues/20) for easy integration with exchanges and other smart contracts. It's the same Token interface used by the [Standard DAO](https://github.com/slockit/DAO/blob/f640568e694a057aaeb64a0f1049fae27efe818b/Token.sol).

Each Dynamic Token issued increases the total supply of tokens. This is an alternative to pre-issuing all tokens to a single account.

## Road Map

CoMakery Ethereum is currently Beta software. Use it with caution and at your own risk.

This software currently implements the Dynamic Token, deployment scripts, and a simple REST server that communicates to an Ethereum node (e.g. geth or parity).

Future features planned include:
- Integration with multiple DAO governance approaches such as [Backfeed](http://backfeed.cc), [The Standard DAO](https://github.com/slockit/DAO), and more classical Access Control DAOs.
- Token exchange smart contracts suitable for integration with token based crowd sale platforms
- Licenses suitable for open innovation

## Open Source License

This software is released under an Open Source MIT licensed. It can be extended and used for commercial or non-commercial purposes.

## Development

[![CircleCI](https://circleci.com/gh/CoMakery/comakery-ethereum/tree/master.svg?style=svg)](https://circleci.com/gh/CoMakery/comakery-ethereum/tree/master)

### Prerequisites

```sh
cp truffle-overrides.js.example truffle-overrides.js  # edit as desired
npm install
```

Recommended: run testrpc server for dev and test (fast):

```sh
npm run testrpc  # run in separate window
```

### Run tests

```sh
npm test
```

### Deploy

```sh
npm run truffle migrate -- --network development
```

This will tell you your contract address.

### Dev server

This starts an express server which receives simple calls and executes contract calls:

```sh
npm run dev:server  # run in separate window
```

### Design Decisions

When to throw, and when to return success -> false?

- throw if the user does not have access to a function, or other "security violation"
- throw on [integer overflow / underflow](http://ethereum.stackexchange.com/questions/7293/is-it-possible-to-overflow-uints)
- return false for other failures (normal control flow)
