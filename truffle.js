/* eslint-disable no-var */
var _ = require('lodash')
var overrides = {}
try { overrides = require('./truffle-overrides') } catch (e) {}

const defaults = {
  rpc: {
    gas: 3141592  // default = 4712388
  },
  networks: {
    production: {
      network_id: 1, // Ethereum public network
      host: 'localhost',
      port: 9999,
      'ethercamp-subdomain': 'live'
    },
    morden: {
      network_id: 2, // morden
      host: 'localhost',
      port: 8888,
      'ethercamp-subdomain': 'morden-state'
    },
    test: {
      network_id: 'default',
      host: 'localhost',
      port: 7777,
      from: '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf',
      'ethercamp-subdomain': 'not-really'
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
