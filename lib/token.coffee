{nodeEnv} = require './config'
path = require 'path'
{ json, pjson, run, type } = require 'lightsaber'
{ isEmpty } = require 'lodash'
{ floor } = Math
debug = require('debug')('token')
Web3 = require 'web3'
Pudding = require "ether-pudding"

envDir = path.resolve __dirname, "../environments/#{nodeEnv}"
TokenContract = require path.join(envDir, "contracts/DynamicToken.sol.js")
config = require path.join(envDir, "config.json")

d = (args...) -> debug pjson args...

# This Token class is a high level wrapper
# which loads the Pudding contract, which:
# 1) is created by Truffle, and
# 2) under the hood uses web3 to make JSON RPC calls to geth

class Token

  @create: ->
    {output} = run "node_modules/.bin/truffle deploy -e #{nodeEnv}"
    pattern = /Deployed.+to address.+(0x[0-9a-f]{40})/
    contractAddress = pattern.exec(output)?[1]
    unless contractAddress
      throw Promise.OperationalError "No contract address found in
        output [[ #{output} ]] -- searched with pattern [[ #{pattern} ]]"
    d {contractAddress}
    contractAddress

  @transfer: (contractAddress, recipient, amount) ->
    web3 = new Web3
    errors = {}
    unless web3.isAddress contractAddress
      errors.contractAddress = "'#{contractAddress}' is not a valid address"
    unless web3.isAddress recipient
      errors.recipient       = "'#{recipient      }' is not a valid address"
    unless type(amount) is 'number' and floor(amount) is amount and amount > 0
      errors.amount = "'#{amount}' is not a positive integer"
    throw Promise.OperationalError(json errors) unless isEmpty errors

    rpcUrl = "http://#{config.rpc.host}:#{config.rpc.port}"
    d { rpcUrl }
    web3.setProvider new Web3.providers.HttpProvider rpcUrl
    Pudding.setWeb3 web3
    TokenContract.load Pudding
    tokenContract = TokenContract.at contractAddress
    sender = config.rpc.from or throw new Error(
      "please set `rpc.from` property: #{envDir}/config.json")

    Promise.resolve()
    .then =>
      tokenContract.balanceOf.call sender
    .then (@senderBalance) =>
      tokenContract.balanceOf.call recipient
    .then (@recipientBalance) =>
      d {@senderBalance, @recipientBalance}
    .then =>
      d { sender, recipient, amount }
      tokenContract.issue recipient, amount, from: sender
    .then (@transactionId) =>
      d @transactionId
      tokenContract.balanceOf.call sender
    .then (@senderBalance) =>
      tokenContract.balanceOf.call recipient
    .then (@recipientBalance) =>
      d {@senderBalance, @recipientBalance}
      return @transactionId

module.exports = Token
