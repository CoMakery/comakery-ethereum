# Playground

Originally forked from https://github.com/CoMakery/comakery-ethereum

## Development

### Prerequisites

```sh
cp truffle-overrides.js.example truffle-overrides.js  # edit as desired
# install yarn: https://yarnpkg.com
yarn install
```

Recommended: run testrpc server for dev and test (fast):

```sh
yarn testrpc  # run in separate window
```

### Run tests

```sh
yarn test
```

### Deploy

Test migrations

```sh
yarn truffle migrate -- --network development
```

### Design Decisions

When to throw, and when to return success -> false?

- throw if the user does not have access to a function, or other "security violation"
- throw on [integer overflow / underflow](http://ethereum.stackexchange.com/questions/7293/is-it-possible-to-overflow-uints)
- return false for other failures (normal control flow)
