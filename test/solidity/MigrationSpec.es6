import {expect} from 'chai'
import {sleep} from 'sleep'
import {d} from 'lightsaber'

import {
  contractIt,
  contractItOnly
} from './testHelper'

contract('Migrations', (accounts) => {
  beforeEach(() => {
    contract = Migrations.deployed()
  })

  describe('#upgrade', () => {
    contractItOnly('owner can run upgrade', (done) => {
      Promise.resolve().then(() => {
        return contract.upgrade(newAddress)
      }).then(() => {
        // testy test
      }).then(done).catch(done)
    })
  })
})

/* Declare global variables for eslint to ignore: */
/* global beforeEach */
/* global contract */
/* global describe */
/* global Migrations */
