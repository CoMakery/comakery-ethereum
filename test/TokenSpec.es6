'use strict'

// import {expect} from 'chai'
let expect = require('chai').expect
// import {d} from 'lightsaber'

/* global Token */
/* global contract */
/* global it */
/* global describe */

const contractIt = (name, func) => {
  contract('', () => {
    it(name, func)
  })
}

contract('Token', (accounts) => {
  let getUsers = (token) => {
    let alice = {address: accounts[0]}
    let bob = {address: accounts[1]}
    let charlie = {address: accounts[2]}

    return Promise.resolve().then(() => {
      return token.getBalance.call(accounts[0])
    }).then((balance) => {
      alice.balance = balance.toNumber()
      return token.getBalance.call(accounts[1])
    }).then((balance) => {
      bob.balance = balance.toNumber()
      return token.getBalance.call(accounts[2])
    }).then((balance) => {
      charlie.balance = balance.toNumber()
    }).then(() => {
      return {alice, bob, charlie}
    })
  }

  contractIt('constructor', (done) => {
    Token.deployed()
    done()
  })

  contractIt('should have the expected test conditions', (done) => {
    const token = Token.deployed()

    Promise.resolve().then(() => {
      return getUsers(token)
    }).then(({alice, bob}) => {
      expect(alice.balance).to.equal(0)
      expect(bob.balance).to.equal(0)
    }).then(done).catch(done)
  })

  describe('happy path', () => {
    // contractIt('should transfer tokens from user to user', (done) => {
    contractIt('should issue tokens from owner to a user', (done) => {
      const token = Token.deployed()
      const amount = 10
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return token.issue(starting.bob.address, amount, {from: starting.alice.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(0)
        expect(ending.bob.balance).to.equal(amount)
      }).then(done).catch(done)
    })

    contractIt('should default to 10 million max tokens', (done) => {
      const token = Token.deployed()
      Promise.resolve().then(() => {
        return token.maxTokens.call()
      }).then((max) => {
        expect(max.toNumber()).to.equal(10e6)
      }).then(done).catch(done)
    })

    contractIt('should transfer tokens from owner to a user', (done) => {
      const token = Token.deployed()
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        token.issue(starting.alice.address, 20, {from: starting.alice.address})
      }).then(() => {
        token.transfer(starting.bob.address, 5, {from: starting.alice.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(15)
        expect(ending.bob.balance).to.equal(5)
      }).then(done).catch(done)
    })

    contractIt('should transfer tokens from user to a user', (done) => {
      const token = Token.deployed()
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        token.issue(starting.alice.address, 20, {from: starting.alice.address})
      }).then(() => {
        token.transfer(starting.bob.address, 5, {from: starting.alice.address})
      }).then(() => {
        token.transfer(starting.charlie.address, 5, {from: starting.bob.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(15)
        expect(ending.bob.balance).to.equal(0)
        expect(ending.charlie.balance).to.equal(5)
      }).then(done).catch(done)
    })
  })

  describe('sad path', () => {
    contractIt('should do nothing if sender does not have enough tokens', (done) => {
      const token = Token.deployed()
      const amount = 10
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        token.transfer(starting.alice.address, amount, {from: starting.bob.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(starting.alice.balance)
        expect(ending.bob.balance).to.equal(starting.bob.balance)
      }).then(done).catch(done)
    })

    contractIt('should only allow contract owner to issue new tokens', (done) => {
      const token = Token.deployed()
      const amount = 10
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return token.issue(starting.bob.address, amount, {from: starting.bob.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(0)
        expect(ending.bob.balance).to.equal(0)
      }).then(done).catch(done)
    })

    contractIt('should do nothing if a the send value is a negative number', (done) => {
      const token = Token.deployed()
      const amount = -1
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        token.transfer(starting.bob.address, amount, {from: starting.alice.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(starting.alice.balance)
        expect(ending.bob.balance).to.equal(starting.bob.balance)
      }).then(done).catch(done)
    })
  })

  describe('maxTokens', () => {
    contractIt('should not allow owner to issue more than max tokens', (done) => {
      const token = Token.deployed()
      const amount = 10e6 + 1
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return token.issue(starting.bob.address, amount, {from: starting.alice.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(0)
        expect(ending.bob.balance).to.equal(0)
      }).then(done).catch(done)
    })

    contractIt('should allow owner to issue max tokens', (done) => {
      const token = Token.deployed()
      const amount = 10e6
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return token.issue(starting.bob.address, amount, {from: starting.alice.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(0)
        expect(ending.bob.balance).to.equal(10e6)
      }).then(done).catch(done)
    })

    contractIt('should allow owner to set maxTokens', (done) => {
      const token = Token.deployed()
      const newMaxTokens = 117

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        token.setMaxTokens(newMaxTokens, {from: users.alice.address})
      }).then(() => {
        return token.maxTokens.call()
      }).then((max) => {
        expect(max.toNumber()).to.equal(117)
      }).then(done).catch(done)
    })

    contractIt('should forbid non-owner from setting maxTokens', (done) => {
      const token = Token.deployed()
      const newMaxTokens = 117

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        token.setMaxTokens(newMaxTokens, {from: users.bob.address})
      }).then(() => {
        return token.maxTokens.call()
      }).then((max) => {
        expect(max.toNumber()).to.equal(10e6)
      }).then(done).catch(done)
    })
  })
})
