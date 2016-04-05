#!/usr/bin/env coffee

chalk = require 'chalk'
{ d, log } = require 'lightsaber'
express = require 'express'
path = require 'path'
bodyParser = require 'body-parser'

app = express()
app.use bodyParser.json()

app.post '/ethereum', (req, res) ->
  d req.body

port = process.env.PORT or 3906
log chalk.magenta "Listenting on port #{port}..."
app.listen port
