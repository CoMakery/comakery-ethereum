#!/usr/bin/env coffee

debug = require('debug')('server')
chalk = require 'chalk'
{ log, pjson } = require 'lightsaber'
express = require 'express'
bodyParser = require 'body-parser'

Token = require './token'

d = (args...) -> debug pjson args...

app = express()
app.use bodyParser.json()

# create contract(s) related to a project
app.post '/project', (request, response) ->
  Promise.try =>
    Token.create()
  .then (contractAddress) =>
    response.json {contractAddress}
  .catch (error) =>
    console.error error.stack
    response.status(500).json { error: (error.message or error.stack) }

# create a token transfer transaction
app.post '/token_transfer', (request, response) ->
  { contractAddress, recipient, amount } = request.body
  d { contractAddress, recipient, amount }
  Promise.try =>
    Token.transfer contractAddress, recipient, amount
  .then (transactionId) =>
    response.json {transactionId}
  .catch (error) =>
    console.error error.stack
    response.status(500).json { error: (error.message or error.stack) }

port = process.env.PORT or 3906
app.listen port, ->
  log chalk.magenta "Listenting on port #{port}..."
