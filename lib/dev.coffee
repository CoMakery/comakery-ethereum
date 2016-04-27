{ pjson, type } = require 'lightsaber'
debug = require('debug')('dev')

{nodeEnv} = require '../lib/config'
Token = require '../lib/token'

d = (args...) -> debug pjson args...

d {nodeEnv}

# throw new Error "testing airbrake in ext script"

# dev:
projectContract  = '0x651f979d2c92f236a782f14a0e4d2671f02a8ac8'
recipient = '0x253ed3c8606a4d594a62ce3c31c224894072c9f9'

# testnet:
# projectContract  = '0x262b7f332d9ae9a793e4d87391b7008b6ccc988d'
# recipient = '0xc853b9709d3743eb2e7ae2a40cd98a35ef3ba50e'

# # prod:
# projectContract  = '0x10cfad11830b591400d846ff7e574407f082afbd'
# recipient = '0x7588f984f396d569ba244a0b61a4905fa26a69ba'

# Token.transfer projectContract, recipient, 100


contractAddress = Token.create()
d {contractAddress}