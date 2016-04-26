{ log, pjson } = require 'lightsaber'
debug = require('debug')('config')
global.Promise = require 'bluebird'
Airbrake = require('airbrake')
require('dotenv').config()

nodeEnv = process.env.NODE_ENV or 'development'
debug {nodeEnv}

d = (args...) -> debug pjson args...

# decreases performance 5x:
Promise.longStackTraces() if process.env.NODE_ENV is 'development'

{ AIRBRAKE_API_KEY, AIRBRAKE_PROJECT_ID } = process.env
if AIRBRAKE_API_KEY and AIRBRAKE_PROJECT_ID
  airbrake = Airbrake.createClient AIRBRAKE_PROJECT_ID,
    AIRBRAKE_API_KEY, nodeEnv
  airbrake.whiteListKeys = []

reportError = (error) ->
  console.error error.stack
  { AIRBRAKE_API_KEY, AIRBRAKE_PROJECT_ID } = process.env
  if AIRBRAKE_API_KEY and AIRBRAKE_PROJECT_ID
    airbrake.notify error, (errorNotifying, url) ->
      if errorNotifying
        console.error """An additional error was encountered while sending
          error messsage to Airbrake! -- #{errorNotifying}"""
      else
        console.log "^^^ Delivered to #{url}"
  # airbrake.handleExceptions()   # not working: use manual airbrake.notify

  # should not be needed anymore:
  # # remove all UPPERCASE_ENVIRONMENT_VARIABLES, including sensitive keys
  # airbrake.on 'vars', (type, vars)->
  #   if type is 'cgi-data'
  #     for key, value of vars
  #       if key.match /^[A-Z_]+$/
  #         d "removing #{key} from airbrake report"
  #         delete vars[key]

  # # catch unhandled promise rejections with Airbrake:
  # process.on 'unhandledRejection', (error, promise)->
  #   throw error unless airbrake
  #   console.error 'Unhandled rejection: ' + (error and error.stack or error)
  #   airbrake.notify error, (airbrakeNotifyError, url)->
  #     if airbrakeNotifyError
  #       throw airbrakeNotifyError
  #     else
  #       debug "Delivered to #{url}"
  #       throw error

module.exports = {nodeEnv, reportError}
