import {expect} from 'chai'
import {d} from 'lightsaber'

const DynamicToken = artifacts.require('../../contracts/DynamicToken.sol')

import {
  contractIt,
  contractItOnly,
  contractShouldThrow,
  contractShouldThrowForNonOwner,
  contractShouldThrowForNonOwnerOnly,
  contractShouldThrowIfClosed,
  contractShouldThrowIfClosedOnly,
  contractShouldThrowIfEtherSent,
  contractShouldThrowIfEtherSentOnly,
  contractShouldThrowOnly
} from './testHelper'

const UNITS_PER_TOKEN = 1e18

contract('DynamicToken', (accounts) => {
  let anyone = accounts[9]
  let token

  const contractShouldThrowIfClosedOnly = (functionToCall) => {
    contractShouldThrowIfClosed(functionToCall, {only: true})
  }

  let getUsers = (token) => {
    let alice = {address: accounts[0]}
    let bob = {address: accounts[1]}
    let charlie = {address: accounts[2]}

    return Promise.resolve().then(() => {
      return token.balanceOf.call(accounts[0])
    }).then((balance) => {
      alice.balance = balance.toNumber()
      return token.balanceOf.call(accounts[1])
    }).then((balance) => {
      bob.balance = balance.toNumber()
      return token.balanceOf.call(accounts[2])
    }).then((balance) => {
      charlie.balance = balance.toNumber()
      return charlie.balance
    }).then(() => {
      // sometimes convenient to identify users by name, other times by role
      let manager = alice
      let spender = bob
      let recipient = charlie
      return {
        alice, bob, charlie,
        manager, spender, recipient
      }
    })
  }

  const firstEvent = (events) => {
    return new Promise((resolve, reject) => {
      events.watch((error, log) => {
        if (error) {
          reject(error)
        } else {
          events.stopWatching()
          resolve(log)
        }
      })
    })
  }

  beforeEach((done) => {
    DynamicToken.deployed(1000, 'Foo', 'FOO').then((_token) => {
      token = _token
      return done()
    }).catch(done)
  })

  describe('expected test conditions', () => {
    contractIt('first account has all tokens', (done) => {
      Promise.resolve().then(() => {
        return getUsers(token)
      }).then(({alice, bob}) => {
        expect(alice.balance).to.equal(1e6 * UNITS_PER_TOKEN) // balance times precision
        expect(bob.balance).to.equal(0)
        return
      }).then(done).catch(done)
    })

    contractIt('allowances of all accounts are zero', (done) => {
      let alice, bob
      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        alice = users.alice
        bob = users.bob
        return token.allowance.call(alice.address, bob.address)
      }).then((allowance) => {
        expect(allowance.toNumber()).to.equal(0)
        return token.allowance.call(bob.address, alice.address)
      }).then((allowance) => {
        expect(allowance.toNumber()).to.equal(0)
        return token.allowance.call(alice.address, alice.address)
      }).then((allowance) => {
        expect(allowance.toNumber()).to.equal(0)
        return
      }).then(done).catch(done)
    })
  })

  describe('#transfer', () => {
    contractShouldThrowIfEtherSent(() => {
      return token.transfer(accounts[0], 10, {value: 1})
    })

    contractIt('should transfer tokens from contract owner to a receiver', (done) => {
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return
      }).then(() => {
        return token.transfer(starting.bob.address, 5, {from: starting.alice.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        // expect(ending.alice.balance).to.equal(15 * UNITS_PER_TOKEN)
        expect(ending.bob.balance).to.equal(5)
        return
      }).then(done).catch(done)
    })

    contractIt('should transfer tokens from user to a user', (done) => {
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return
      }).then(() => {
        return token.transfer(starting.bob.address, 5, {from: starting.alice.address})
      }).then(() => {
        return token.transfer(starting.charlie.address, 5, {from: starting.bob.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.bob.balance).to.equal(0)
        expect(ending.charlie.balance).to.equal(5)
        return
      }).then(done).catch(done)
    })

    contractIt('should allow the token owner to transfer tokens to other users', (done) => {
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return
      }).then(() => {
        return token.transfer(starting.bob.address, 5, {from: starting.alice.address})
      }).then(() => {
        return token.transfer(starting.charlie.address, 5, {from: starting.bob.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.bob.balance).to.equal(0)
        expect(ending.charlie.balance).to.equal(5)
        return
      }).then(done).catch(done)
    })

    contractIt('should fire a Transfer event when a transfer is sucessful', (done) => {
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return
      }).then(() => {
        return token.transfer(starting.bob.address, 5, {from: starting.alice.address})
      }).then(() => {
        return firstEvent(token.Transfer())
      }).then((log) => {
        expect(log.args.from).to.equal(starting.alice.address)
        expect(log.args.to).to.equal(starting.bob.address)
        expect(log.args.value.toNumber()).to.equal(5)
        done()
        return
      }).catch(done)
    })
  })

  describe('#transferFrom', () => {
    contractShouldThrowIfEtherSent(() => {
      return token.transferFrom(accounts[1], accounts[2], 3, {value: 1})
    })

    contractIt('spender can spend within allowance set by manager', (done) => {
      let manager, spender, recipient

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        manager = users.manager.address
        spender = users.spender.address
        recipient = users.recipient.address
        return
      }).then(() => {
        return token.approve(spender, 100, {from: manager})
      }).then(() => {
        return token.transferFrom(manager, recipient, 40, {from: spender})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.spender.balance).to.equal(0)
        expect(ending.recipient.balance).to.equal(40)
        return
      }).then(() => {
        return token.allowance.call(manager, spender, {from: anyone})
      }).then((allowance) => {
        expect(allowance.toNumber()).to.equal(60)
        return
      }).then(done).catch(done)
    })

    contractIt('should fire a Transfer event when a transfer is sucessful', (done) => {
      let manager, spender, recipient

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        manager = users.manager.address
        spender = users.spender.address
        recipient = users.recipient.address
        return
      }).then(() => {
        return token.approve(spender, 100, {from: manager})
      }).then(() => {
        return token.transferFrom(manager, recipient, 50, {from: spender})
      }).then(() => {
        return firstEvent(token.Transfer())
      }).then((log) => {
        expect(log.args.from).to.equal(manager)
        expect(log.args.to).to.equal(recipient)
        expect(log.args.value.toNumber()).to.equal(50)
        done()
        return
      }).catch(done)
    })
  })
})
