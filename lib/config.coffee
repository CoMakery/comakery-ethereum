global.Promise = require 'bluebird'

nodeEnv = process.env.NODE_ENV or 'development'

module.exports = {nodeEnv}
