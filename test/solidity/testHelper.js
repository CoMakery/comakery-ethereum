import Promise from 'bluebird'

global.Promise = Promise

export const contractShouldThrow = (description, functionToCall, options) => {
  contractIt(description, (done) => {
    Promise.resolve().then(functionToCall
    ).then(function () {
      throw new Error('Expected solidity error to be thown from contract, but was not')
    }).catch(function (error) {
      if (!error.message || error.message.search('invalid JUMP') < 0) throw error
    }).then(done).catch(done)
  }, options)
}

export const contractShouldThrowOnly = (description, functionToCall) => {
  contractShouldThrow(description, functionToCall, {only: true})
}

export const contractShouldThrowIfEtherSent = (functionToCall, opts) => {
  contractShouldThrow('should throw an error if ether is sent', functionToCall, opts)
}

export const contractShouldThrowIfEtherSentOnly = (functionToCall) => {
  contractShouldThrowIfEtherSent(functionToCall, {only: true})
}

export const contractShouldThrowForNonOwner = (functionToCall, opts) => {
  contractShouldThrow('should throw an error for non-owner', () => {
    return functionToCall()
  }, opts)
}

export const contractShouldThrowForNonOwnerOnly = (functionToCall) => {
  contractShouldThrowForNonOwner(functionToCall, {only: true})
}

export const contractItOnly = (name, func) => {
  contractIt(name, func, {only: true})
}

export const contractIt = (name, func, options) => {
  options = options || {}
  contract('', () => {
    describe('Contract:', function () {
      this.timeout(3000)
      if (options.only) {
        it.only(name, func)
      } else {
        it(name, func)
      }
    })
  })
}

/* Declare global variables for eslint to ignore: */
/* global contract */
/* global it */
/* global describe */
