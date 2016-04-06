#!/usr/bin/env coffee

debug = require('debug')('server')
chalk = require 'chalk'
{ log, pjson } = require 'lightsaber'
express = require 'express'
path = require 'path'
bodyParser = require 'body-parser'

Token = require './token'

d = (args...) -> debug pjson args...

app = express()
app.use bodyParser.json()

app.post '/transfer', (req, res) ->
  { contractAddress, recipient, amount } = req.body
  d { contractAddress, recipient, amount }
  try
    Token.transfer contractAddress, recipient, amount
    .then (transactionId) => res.send {transactionId}
  catch error
    response.send { error }

port = process.env.PORT or 3906
app.listen port, ->
  log chalk.magenta "Listenting on port #{port}..."
