path = require 'path'
{ pjson } = require 'lightsaber'
debug = require('debug')('token')
Web3 = require 'web3'
Pudding = require "ether-pudding"

NODE_ENV = process.env.NODE_ENV or 'development'
envDir = path.resolve __dirname, "../environments/#{NODE_ENV}"
TokenContract = require path.join(envDir, "contracts/Token.sol.js")
config = require path.join(envDir, "config.json")

d = (args...) -> debug pjson args...

class Token

  @transfer: (contractAddress, recipient, amount) ->
    rpcUrl = "http://#{config.rpc.host}:#{config.rpc.port}"
    d { rpcUrl }
    provider = new Web3.providers.HttpProvider rpcUrl
    web3 = new Web3 provider
    Pudding.setWeb3 web3
    TokenContract.load Pudding
    tokenContract = TokenContract.at contractAddress
    sender = config.rpc.from or throw new Error "please set `rpc.from` property: #{envDir}/config.json"

    Promise.resolve()
    .then =>
      tokenContract.getBalance.call sender
    .then (@senderBalance) =>
      tokenContract.getBalance.call recipient
    .then (@recipientBalance) =>
      d {@senderBalance, @recipientBalance}
    .then =>
      d { sender, recipient, amount }
      tokenContract.transfer recipient, amount, from: sender
    .then (@transactionId) =>
      d @transactionId
      tokenContract.getBalance.call sender
    .then (@senderBalance) =>
      tokenContract.getBalance.call recipient
    .then (@recipientBalance) =>
      d {@senderBalance, @recipientBalance}
      return @transactionId

    .catch (error) =>
      console.error error
      throw new Error error

module.exports = Token
