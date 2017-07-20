require('babel-register')
require('babel-polyfill')

/* eslint-disable no-var */

require('babel-core/register')
require('babel-polyfill')

var _ = require('lodash')
var overrides
try {
  overrides = require('./truffle-overrides')
} catch (e) {
  overrides = {}
}

const defaults = {
  networks: {
    production: {
      network_id: 1, // Ethereum public network
      host: 'localhost',
      port: 9999,
      gasPrice: 3e9,
      gas: 220674,
      ethercampApiSubdomain: 'state'
    },
    ropsten: {
      network_id: 3,
      host: 'localhost',
      port: 8888,
      ethercampApiSubdomain: 'ropsten-state'
    },
    test: {
      network_id: 'default',
      host: 'localhost',
      port: 7777,
      from: '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf',
      ethercampApiSubdomain: 'not-really'
    },
    development: {
      network_id: 'default',
      host: 'localhost',
      port: 7777,
      from: '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf'
    }
  },
  mocha: {
    useColors: true
  }
}

var config = _.defaultsDeep(overrides, defaults)
module.exports = config
