'use strict'

// let {d} = require('lightsaber')
/* global Token */
/* global contract */
/* global it */
/* global assert */

contract('Token', (accounts) => {
  it('constructor', (done) => {
    Token.deployed()
    done()
  })

  it('should do nothing and return the gas if sender does not have enough tokens', (done) => {
    const token = Token.deployed()

    const sender = accounts[1]
    const receiver = accounts[0]

    let receiverStartingBalance
    let senderStartingBalance
    let receiverEndingBalance
    let senderEndingBalance

    const amount = 10

    Promise.resolve().then(() => {
      return token.getBalance.call(receiver)
    }).then((balance) => {
      receiverStartingBalance = balance.toNumber()
      return token.getBalance.call(sender)
    }).then((balance) => {
      senderStartingBalance = balance.toNumber()
      assert.equal(senderStartingBalance, 0)
      return token.transfer(receiver, amount, {from: sender})
    }).then(() => {
      return token.getBalance.call(receiver)
    }).then((balance) => {
      receiverEndingBalance = balance.toNumber()
      return token.getBalance.call(sender)
    }).then((balance) => {
      senderEndingBalance = balance.toNumber()

      assert.equal(receiverEndingBalance, receiverStartingBalance, 'Receiver balance should not change')
      assert.equal(senderEndingBalance, senderStartingBalance, 'Sender balance should not change')
    }).then(done).catch(done)
  })

  it('should transfer tokens from one address to another', (done) => {
    const token = Token.deployed()

    // Get initial balances of first and second account.
    const accountOne = accounts[0]
    const accountTwo = accounts[1]

    let accountOneStartingBalance
    let accountTwoStartingBalance
    let accountOneEndingBalance
    let accountTwoEndingBalance

    const amount = 10

    Promise.resolve().then(() => {
      return token.getBalance.call(accountOne)
    }).then((balance) => {
      accountOneStartingBalance = balance.toNumber()
      return token.getBalance.call(accountTwo)
    }).then((balance) => {
      accountTwoStartingBalance = balance.toNumber()
      return token.transfer(accountTwo, amount, {from: accountOne})
    }).then(() => {
      return token.getBalance.call(accountOne)
    }).then((balance) => {
      accountOneEndingBalance = balance.toNumber()
      return token.getBalance.call(accountTwo)
    }).then((balance) => {
      accountTwoEndingBalance = balance.toNumber()

      assert.equal(accountOneEndingBalance, accountOneStartingBalance - amount, 'Amount was not correctly taken from the sender')
      assert.equal(accountTwoEndingBalance, accountTwoStartingBalance + amount, 'Amount was not correctly sent to the receiver')
    }).then(done).catch(done)
  })
})
