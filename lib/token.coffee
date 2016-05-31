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

envDir = path.resolve __dirname, "../environments/#{nodeEnv}"
config = require path.join(envDir, "config.json")

d = (args...) -> debug pjson args...

# This Token class is a high level wrapper
# which loads the Pudding contract, which:
# 1) is created by Truffle, and
# 2) under the hood uses web3 to make JSON RPC calls to geth

class Token
  CONTRACT_NAME = 'DynamicToken'

  @deployContract: ->
    quiet = nodeEnv is 'test'
    {output} = run "node_modules/.bin/truffle deploy -e #{nodeEnv}", {quiet}
    pattern = /Deployed.+to address.+(0x[0-9a-f]{40})/
    contractAddress = pattern.exec(output)?[1]
    unless contractAddress
      throw Promise.OperationalError "No contract address found in
        output [[ #{output} ]] -- searched with pattern [[ #{pattern} ]]"
    d {contractAddress}
    contractAddress

  @loadContract: (contractAddress) ->
    TokenContract = require path.join(envDir, "contracts/#{CONTRACT_NAME}.sol.js")
    web3 = new Web3
    rpcUrl = "http://#{config.rpc.host}:#{config.rpc.port}"
    d { rpcUrl }
    web3.setProvider new Web3.providers.HttpProvider rpcUrl
    Pudding.setWeb3 web3
    TokenContract.load Pudding
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
      tokenContract.setMaxSupply newMaxSupply, from: config.rpc.from
    .then =>
      tokenContract.maxSupply.call()
    .then (maxSupply) =>
      d {maxSupply}
      d {contractAddress}
      contractAddress

  @uploadSource: (contractAddress, callback) ->
    return if nodeEnv is 'development'
    contractAddress = contractAddress.replace /^0x/, ''
    subdomain = config['ethercamp-subdomain']
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
      info = JSON.parse(body) if httpResponse?['content-type'] is 'application/json;charset=UTF-8'
      if info?.success
        d "Uploaded contract source to:"
        d "https://#{subdomain}.ether.camp/account/#{contractAddress}/contract"
      else
        d 'Contract upload failed'
      debug body
      callback?(err, body)

  @issue: (contractAddress, recipient, amount) ->
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
    sender = config.rpc.from or throw new Error(
      "please set `rpc.from` property: #{envDir}/config.json")

    Promise.resolve()
    .then =>
      tokenContract.balanceOf.call recipient
    .then (@recipientBalance) =>
      d {@recipientBalance}
      d { sender, recipient, amount }
      tokenContract.issue recipient, amount, from: sender
    .then (@transactionId) =>
      d {@transactionId}
      tokenContract.balanceOf.call recipient
    .then (@recipientBalance) =>
      d {@recipientBalance}
      @transactionId

module.exports = Token
