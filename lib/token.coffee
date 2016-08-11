{nodeEnv} = require './config'
path = require 'path'
{ json, log, pjson, run, type } = require 'lightsaber'
{ isEmpty } = require 'lodash'
{ floor } = Math
fs = require 'fs'
request = require 'request'
debug = require('debug')('token')
Web3 = require 'web3'
Pudding = require "ether-pudding"

config = require('../truffle').networks[nodeEnv]

d = (args...) -> debug pjson args...

# This Token class is a high level wrapper
# which loads the Pudding contract, which:
# 1) is created by Truffle, and
# 2) under the hood uses web3 to make JSON RPC calls to an ethereum node

class Token
  CONTRACT_NAME = 'DynamicToken'

  @deployContract: ->
    {output} = run "node_modules/.bin/truffle migrate --network #{nodeEnv}
      --reset --verbose-rpc", relaxed: true, quiet: nodeEnv is 'test'
    pattern = ///#{CONTRACT_NAME}:\s(0x[0-9a-f]{40})///
    contractAddress = pattern.exec(output)?[1]
    return contractAddress if contractAddress
    if output.search /Error: Insufficient funds/
      throw Promise.OperationalError "Insufficient funds in account
        #{config.from} -- full output: [[ #{output} ]]"
    throw Promise.OperationalError "No contract address
      pattern [[ #{pattern} ]] found in output [[ #{output} ]]"

  @loadContract: (contractAddress) ->
    TokenContract = require "../build/contracts/#{CONTRACT_NAME}.sol.js"
    rpcUrl = "http://#{config.host}:#{config.port}"
    d { rpcUrl }
    TokenContract.setProvider new Web3.providers.HttpProvider rpcUrl
    TokenContract.at contractAddress

  @create: (newMaxSupply) ->
    contractAddress = @deployContract()
    @uploadSource contractAddress
    tokenContract = @loadContract contractAddress
    Promise.resolve()
    .then =>
      tokenContract.maxSupply.call()
    .then (maxSupply) =>
      d {maxSupply, newMaxSupply}
      tokenContract.setMaxSupply newMaxSupply, from: config.from
    .then =>
      tokenContract.maxSupply.call()
    .then (maxSupply) =>
      d {maxSupply}
      d {contractAddress}
      contractAddress

  @uploadSource: (contractAddress, callback) ->
    return if nodeEnv is 'development'
    contractAddress = contractAddress.replace /^0x/, ''
    subdomain = config.ethercampApiSubdomain
    url = "https://#{subdomain}.ether.camp/api/v1/accounts/#{contractAddress}/contract"
    d { url }
    formData =
      name: CONTRACT_NAME
      contracts:
        value: fs.createReadStream(path.resolve(__dirname, "../contracts/#{CONTRACT_NAME}.sol"))
        options:
          name: 'contracts'
          filename: "#{CONTRACT_NAME}.sol"
    headers = "rejectUnauthorized": false
    NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    request.post {url, formData, headers}, (err, httpResponse, body) ->
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = NODE_TLS_REJECT_UNAUTHORIZED
      d "attempted to upload smart contract to #{url}"
      callback?(err, body)

  @issue: (contractAddress, recipient, amount, proofId) ->
    web3 = new Web3
    errors = {}
    unless web3.isAddress contractAddress
      errors.contractAddress = "'#{contractAddress}' is not a valid address"
    unless web3.isAddress recipient
      errors.recipient       = "'#{recipient      }' is not a valid address"
    unless type(amount) is 'number' and floor(amount) is amount and amount > 0
      errors.amount = "'#{amount}' is not a positive integer"
    throw Promise.OperationalError(json errors) unless isEmpty errors

    tokenContract = @loadContract contractAddress
    sender = config.from or throw new Error(
      "please set `networks.#{envDir}.from` property in truffle.js")

    Promise.resolve()
    .then =>
      tokenContract.balanceOf.call recipient
    .then (@recipientBalance) =>
      d {@recipientBalance}
      d { sender, recipient, amount }
      tokenContract.issue recipient, amount, proofId, from: sender, gas: 2e6
    .then (@transactionId) =>
      d {@transactionId}
      tokenContract.balanceOf.call recipient
    .then (@recipientBalance) =>
      d {@recipientBalance}
      @transactionId

module.exports = Token
