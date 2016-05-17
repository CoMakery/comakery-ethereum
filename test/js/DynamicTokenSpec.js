process.env.NODE_ENV = 'test'
require('coffee-script/register')

const Web3 = require('web3')
const Pudding = require('ether-pudding')
import {d} from 'lightsaber'
import {expect} from 'chai'
const path = require('path')
// import Token from '../lib/token'
const Token = require('../../lib/token')

/* Declare global variables for eslint to ignore: */
/* global describe */
/* global it */

describe('DynamicToken', () => {
  describe('#create', function () {
    const envDir = path.resolve(__dirname, '../../environments/test')
    const config = require(path.join(envDir, 'config.json'))
    const rpcUrl = `http://${config.rpc.host}:${config.rpc.port}`
    const web3 = new Web3()
    web3.setProvider(new Web3.providers.HttpProvider(rpcUrl))
    Pudding.setWeb3(web3)

    it('should set max supply', (done) => {
      const TokenContract = require(path.join(envDir, 'contracts/DynamicToken.sol.js'))
      TokenContract.load(Pudding)

      Token.create(101)
      .then((contractAddress) => {
        const tokenContract = TokenContract.at(contractAddress)
        return tokenContract.maxSupply.call()
      }).then((maxSupply) => {
        expect(maxSupply.toNumber()).to.eq(101)
      }).then(done).catch(done)
    })
  })
})
