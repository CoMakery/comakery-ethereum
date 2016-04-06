#!/usr/bin/env coffee

chalk = require 'chalk'
{ d, log } = require 'lightsaber'
express = require 'express'
path = require 'path'
bodyParser = require 'body-parser'

app = express()
app.use bodyParser.json()

app.post '/transfer', (req, res) ->
  { contractAddress, recipient, amount } = req.body
  Token.transfer contractAddress, recipient, amount

port = process.env.PORT or 3906
app.listen port, ->
  log chalk.magenta "Listenting on port #{port}..."
