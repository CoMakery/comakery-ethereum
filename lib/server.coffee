{reportError} = require './config'
debug = require('debug')('server')
{ json, log, pjson } = require 'lightsaber'
{ includes, isEmpty } = require 'lodash'
express = require 'express'
bodyParser = require 'body-parser'
timeout = require('connect-timeout')

Token = require './token'

d = (args...) -> debug pjson args...

app = express()
# app.use airbrake.expressHandler()  # seems to not work :(

# NOTE the use of haltOnTimedout
# after every middleware; it will stop the request flow on a timeout
# from https://github.com/expressjs/timeout#as-top-level-middleware
haltOnTimedout = (req, res, next) -> next() if (!req.timedout)

requireApiKey = (req, res, next) ->
  # log pjson req
  apiKeyWhitelist = (process.env.API_KEY_WHITELIST || '').split(',')
  {apiKey} = req.body
  if !isEmpty(apiKey) and includes(apiKeyWhitelist, req.body.apiKey)
    next()
  else
    res.status(403).json { error: 'API key not found'}

app.use(timeout('600s'))  # 10 min
app.use(bodyParser.json())
app.use(haltOnTimedout)
app.use(requireApiKey)
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
