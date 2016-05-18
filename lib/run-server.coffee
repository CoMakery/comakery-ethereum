chalk = require 'chalk'
{ log, pjson } = require 'lightsaber'

app = require './server'

port = process.env.PORT or 3906
app.listen port, ->
  log chalk.magenta "Listenting on port #{port}..."
