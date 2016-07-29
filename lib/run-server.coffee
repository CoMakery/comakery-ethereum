chalk = require 'chalk'
{ log, pjson } = require 'lightsaber'

{app, TIMEOUT_MINUTES} = require './server'

port = process.env.PORT or 3906
server = app.listen port, 'localhost', ->
  log chalk.magenta "Listenting on port #{port}..."

server.timeout = TIMEOUT_MINUTES * 60 * 1000
