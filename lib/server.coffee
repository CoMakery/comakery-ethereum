{reportError} = require './config'
debug = require('debug')('server')
{ json, log, pjson } = require 'lightsaber'
express = require 'express'
bodyParser = require 'body-parser'
timeout = require('connect-timeout')

Token = require './token'

d = (args...) -> debug pjson args...

app = express()
# app.use airbrake.expressHandler()  # seems to not work :(
# from https://github.com/expressjs/timeout#as-top-level-middleware
haltOnTimedout = (req, res, next) ->
  next() if (!req.timedout)

app.use(timeout('600s'))
app.use(bodyParser.json())
app.use(haltOnTimedout)

# create new contract for a project
app.post '/project', (request, response) ->
  Promise.try =>
    { maxSupply } = request.body
    unless maxSupply
      throw Promise.OperationalError(
        "maxSupply required but not found in body #{json request.body}")
    d { maxSupply }
    Token.create(maxSupply)
  .then (contractAddress) =>
    response.json {contractAddress}
  .catch (error) =>
    reportError error
    response.status(500).json { error: (error.message or error.stack) }

# create a token issue transaction
app.post '/token_issue', (request, response) ->
  { contractAddress, recipient, amount } = request.body
  d { contractAddress, recipient, amount }
  Promise.try =>
    Token.issue contractAddress, recipient, amount
  .then (transactionId) =>
    response.json {transactionId}
  .catch (error) =>
    reportError error
    response.status(500).json { error: (error.message or error.stack) }

module.exports = app
