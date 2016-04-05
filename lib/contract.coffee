{ d, log } = require 'lightsaber'
Web3 = require 'web3'
Pudding = require("ether-pudding")
Contract = require '../../comakery-app/ethereum/environments/testnet/contracts/Token.sol.js'

class Contract

  execute: ->
    web3 = new Web3();
    web3.setProvider(new Web3.Providers.HttpProvider("http://localhost:8888"))
    Pudding.setWeb3(web3);
    Contract.load Pudding

    # d eth = web3.eth
    # coinbase = web3.eth.coinbase
    # balance = web3.eth.getBalance(coinbase)
    # d balance.toString 10

module.exports = Contract
