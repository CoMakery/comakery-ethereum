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

    let receiver_starting_balance
    let sender_starting_balance
    let receiver_ending_balance
    let sender_ending_balance

    const amount = 10

    Promise.resolve().then(() => {
      return token.getBalance.call(receiver)
    }).then((balance) => {
      receiver_starting_balance = balance.toNumber()
      return token.getBalance.call(sender)
    }).then((balance) => {
      sender_starting_balance = balance.toNumber()
      assert.equal(sender_starting_balance, 0)
      return token.transfer(receiver, amount, {from: sender})
    }).then(() => {
      return token.getBalance.call(receiver)
    }).then((balance) => {
      receiver_ending_balance = balance.toNumber()
      return token.getBalance.call(sender)
    }).then((balance) => {
      sender_ending_balance = balance.toNumber()

      assert.equal(receiver_ending_balance, receiver_starting_balance, 'Receiver balance should not change')
      assert.equal(sender_ending_balance, sender_starting_balance, 'Sender balance should not change')
    }).then(done).catch(done)
  })

  it('should transfer tokens from one address to another', (done) => {
    const token = Token.deployed()

    // Get initial balances of first and second account.
    const account_one = accounts[0]
    const account_two = accounts[1]

    let account_one_starting_balance
    let account_two_starting_balance
    let account_one_ending_balance
    let account_two_ending_balance

    const amount = 10

    Promise.resolve().then(() => {
      return token.getBalance.call(account_one)
    }).then((balance) => {
      account_one_starting_balance = balance.toNumber()
      return token.getBalance.call(account_two)
    }).then((balance) => {
      account_two_starting_balance = balance.toNumber()
      return token.transfer(account_two, amount, {from: account_one})
    }).then(() => {
      return token.getBalance.call(account_one)
    }).then((balance) => {
      account_one_ending_balance = balance.toNumber()
      return token.getBalance.call(account_two)
    }).then((balance) => {
      account_two_ending_balance = balance.toNumber()

      assert.equal(account_one_ending_balance, account_one_starting_balance - amount, 'Amount was not correctly taken from the sender')
      assert.equal(account_two_ending_balance, account_two_starting_balance + amount, 'Amount was not correctly sent to the receiver')
    }).then(done).catch(done)
  })
})
