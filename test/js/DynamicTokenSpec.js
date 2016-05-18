require('./testHelper')
require('coffee-script/register')

import {d} from 'lightsaber'
import {expect} from 'chai'

const Token = require('../../lib/token')

describe('DynamicToken', () => {
  describe('#create', function () {
    it('should set max supply', (done) => {
      Token.create(101)
      .then((contractAddress) => {
        const tokenContract = Token.loadContract(contractAddress)
        return tokenContract.maxSupply.call()
      }).then((maxSupply) => {
        expect(maxSupply.toNumber()).to.eq(101)
      }).then(done).catch(done)
    })
  })
})

/* Declare global variables for eslint to ignore: */
/* global describe */
/* global it */
