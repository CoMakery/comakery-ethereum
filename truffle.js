module.exports = {
  networks: {
    'live': {
      network_id: 1, // Ethereum public network
      host: 'localhost',
      port: 9999,
      from: '0x03b3536e825a484f796b094e63011027620bc2a7',
      'ethercamp-subdomain': 'live'
    },
    'testnet': {
      network_id: 2, // morden
      host: 'localhost',
      port: 8888,
      from: '0x5edb0f31d5d8c3146ea6f5c31c7f571c0aeb8fc2',
      'ethercamp-subdomain': 'morden-state'
    },
    'test': {
      network_id: 'default',
      host: 'localhost',
      port: 7777,
      from: '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf',
      'ethercamp-subdomain': 'not-really'
    },
    'development': {
      network_id: 'default',
      host: 'localhost',
      port: 7777,
      from: '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf'
    }
    // optional config values:
    // - gas
    // - gasPrice
  },
  mocha: {
    'useColors': true
  }
}
