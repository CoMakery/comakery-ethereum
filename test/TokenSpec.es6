import {expect} from 'chai'
import {d} from 'lightsaber'

/* Declare global variables for eslint to ignore: */
/* global beforeEach */
/* global contract */
/* global describe */
/* global it */
/* global DynamicToken */

const contractIt = (name, func) => {
  contract('', () => {
    describe('Contract:', function () {
      this.timeout(2000)
      it(name, func)
    })
  })
}

const contractItOnly = (name, func) => {
  contract('', () => {
    describe('Contract:', function () {
      this.timeout(2000)
      it.only(name, func)
    })
  })
}

let contractShouldThrowIfEtherSent = (functionToCall) => {
  contractShouldThrow('should throw an error if ether is sent', functionToCall)
}

let contractShouldThrow = (description, functionToCall) => {
  contractIt(description, (done) => {
    Promise.resolve().then(functionToCall
    ).then(function () {
      throw new Error('Expected solidity error to be thown from contract, but was not')
    }).catch(function (error) {
      if (error.message.search('invalid JUMP') === -1) throw error
    }).then(done).catch(done)
  })
}

contract('DynamicToken', (accounts) => {
  let anyone = accounts[9]
  let token

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
    }).then(() => {
      // sometimes convenient to identify users by name, other times by role
      let manager = alice
      let spender = bob
      let recipient = charlie
      return {alice, bob, charlie,
        manager, spender, recipient}
    })
  }

  let firstEvent = (events) => {
    return new Promise((resolve, reject) => {
      events.watch((error, log) => {
        if (error) {
          reject(error)
        } else {
          resolve(log)
        }
      })
    })
  }

  beforeEach(() => {
    token = DynamicToken.deployed()
  })

  describe('expected test conditions', () => {
    contractIt('token balances of all accounts are zero', (done) => {
      Promise.resolve().then(() => {
        return getUsers(token)
      }).then(({alice, bob}) => {
        expect(alice.balance).to.equal(0)
        expect(bob.balance).to.equal(0)
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
      }).then(done).catch(done)
    })
  })

  describe('#allowance', () => {
    contractShouldThrowIfEtherSent(() => {
      return token.allowance(accounts[1], accounts[2], {value: 1})
    })
  })

  describe('#balanceOf', () => {
    contractShouldThrowIfEtherSent(() => {
      return token.balanceOf(accounts[1], {value: 1})
    })
  })

  describe('#issue', () => {
    contractShouldThrowIfEtherSent(() => {
      return token.issue(accounts[1], 10, {value: 1})
    })

    contractIt('should issue tokens from owner to a user', (done) => {
      const amount = 10
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        token.issue(starting.bob.address, amount, {from: starting.alice.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(0)
        expect(ending.bob.balance).to.equal(amount)
      }).then(done).catch(done)
    })

    contractIt('should only allow contract owner to issue new tokens', (done) => {
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

    contractShouldThrow('should throw an error if token balance overflows', () => {
      let MAXISH = 1e77  // max value of a uint256 is ~ 1.157920892373162e+77

      return Promise.resolve().then(() => {
        return token.setTotalSupply(MAXISH)
      }).then(() => {
        return token.issue(accounts[1], MAXISH)
      }).then(() => {
        return token.issue(accounts[1], MAXISH)
      })
    })
  })

  describe('#transfer', () => {
    contractShouldThrowIfEtherSent(() => {
      return token.transfer(accounts[0], 10, {value: 1})
    })

    contractIt('should transfer tokens from owner to a user', (done) => {
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

    contractIt('should allow to token owner to transfer tokens to other users', (done) => {
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

    contractIt('should fire a Transfer event when a tranfer is sucessful', (done) => {
      let events = token.Transfer()
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        token.issue(starting.alice.address, 20, {from: starting.alice.address})
      }).then(() => {
        token.transfer(starting.bob.address, 5, {from: starting.alice.address})
      }).then(() => {
        return firstEvent(events)
      }).then((log) => {
        expect(log.args._from).to.equal(starting.alice.address)
        expect(log.args._to).to.equal(starting.bob.address)
        expect(log.args._amount.toNumber()).to.equal(5)
        done()
      })
    })

    contractIt('should do nothing if sender does not have enough tokens', (done) => {
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

    contractIt('should do nothing if a the send value is a negative number', (done) => {
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
        token.issue(manager, 200, {from: manager})
      }).then(() => {
        token.approve(spender, 100, {from: manager})
      }).then(() => {
        return token.transferFrom(manager, recipient, 40, {from: spender})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.manager.balance).to.equal(160)
        expect(ending.spender.balance).to.equal(0)
        expect(ending.recipient.balance).to.equal(40)
      }).then(() => {
        return token.allowance.call(manager, spender, {from: anyone})
      }).then((allowance) => {
        expect(allowance.toNumber()).to.equal(60)
      }).then(done).catch(done)
    })

    contractIt('should fire a Transfer event when a tranfer is sucessful', (done) => {
      let events = token.Transfer()
      let manager, spender, recipient

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        manager = users.manager.address
        spender = users.spender.address
        recipient = users.recipient.address
        token.issue(manager, 200, {from: manager})
      }).then(() => {
        token.approve(spender, 100, {from: manager})
      }).then(() => {
        return token.transferFrom(manager, recipient, 50, {from: spender})
      }).then(() => {
        return firstEvent(events)
      }).then((log) => {
        expect(log.args._from).to.equal(manager)
        expect(log.args._to).to.equal(recipient)
        expect(log.args._amount.toNumber()).to.equal(50)
        done()
      })
    })

    contractIt('should fire a TransferFrom event when a tranfer is sucessful', (done) => {
      let events = token.TransferFrom()
      let manager, spender, recipient

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        manager = users.manager.address
        spender = users.spender.address
        recipient = users.recipient.address
        token.issue(manager, 200, {from: manager})
      }).then(() => {
        token.approve(spender, 100, {from: manager})
      }).then(() => {
        return token.transferFrom(manager, recipient, 50, {from: spender})
      }).then(() => {
        return firstEvent(events)
      }).then((log) => {
        expect(log.args._from).to.equal(manager)
        expect(log.args._to).to.equal(recipient)
        expect(log.args._spender).to.equal(spender)
        expect(log.args._amount.toNumber()).to.equal(50)
        done()
      })
    })

    contractIt('spender cannot spend more than allowance set by manager', (done) => {
      let manager, spender, recipient

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        manager = users.manager.address
        spender = users.spender.address
        recipient = users.recipient.address
        token.issue(manager, 200, {from: manager})
      }).then(() => {
        token.approve(spender, 100, {from: manager})
      }).then(() => {
        token.transferFrom(manager, recipient, 101, {from: spender})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.manager.balance).to.equal(200)
        expect(ending.spender.balance).to.equal(0)
        expect(ending.recipient.balance).to.equal(0)
      }).then(() => {
        return token.allowance.call(manager, spender, {from: anyone})
      }).then((allowance) => {
        expect(allowance.toNumber()).to.equal(100)
      }).then(done).catch(done)
    })

    contractIt('spender cannot spend more than current balance of manager', (done) => {
      let manager, spender, recipient

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        manager = users.manager.address
        spender = users.spender.address
        recipient = users.recipient.address
        token.issue(manager, 100, {from: manager})
      }).then(() => {
        token.approve(spender, 300, {from: manager})
      }).then(() => {
        return token.transferFrom(manager, recipient, 200, {from: spender})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.manager.balance).to.equal(100)
        expect(ending.spender.balance).to.equal(0)
        expect(ending.recipient.balance).to.equal(0)
      }).then(() => {
        return token.allowance.call(manager, spender, {from: anyone})
      }).then((allowance) => {
        expect(allowance.toNumber()).to.equal(300)
      }).then(done).catch(done)
    })

    contractIt('spender cannot send a negative token amount', (done) => {
      let manager, spender, recipient

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        manager = users.manager.address
        spender = users.spender.address
        recipient = users.recipient.address
        token.issue(manager, 100, {from: manager})
      }).then(() => {
        token.issue(recipient, 100, {from: manager})
      }).then(() => {
        token.approve(spender, 100, {from: manager})
      }).then(() => {
        token.approve(spender, 100, {from: recipient})
      }).then(() => {
        return token.transferFrom(manager, recipient, -1, {from: spender})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.manager.balance).to.equal(100)
        expect(ending.spender.balance).to.equal(0)
        expect(ending.recipient.balance).to.equal(100)
      }).then(() => {
        return token.allowance.call(manager, spender, {from: anyone})
      }).then((allowance) => {
        expect(allowance.toNumber()).to.equal(100)
      }).then(() => {
        return token.allowance.call(recipient, spender, {from: anyone})
      }).then((allowance) => {
        expect(allowance.toNumber()).to.equal(100)
      }).then(done).catch(done)
    })
  })

  describe('#approve', () => {
    contractShouldThrowIfEtherSent(() => {
      return token.approve(accounts[1], 100, {value: 1})
    })

    contractIt('manager can approve allowance for spender to spend', (done) => {
      let manager, spender

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        manager = users.alice.address
        spender = users.bob.address
        token.approve(spender, 100, {from: manager})
      }).then(() => {
        return token.allowance.call(manager, spender, {from: anyone})
      }).then((allowance) => {
        expect(allowance.toNumber()).to.equal(100)
      }).then(done).catch(done)
    })

    contractIt('should fire an Approval event when a tranfer is sucessful', (done) => {
      let events = token.Approval()
      let manager, spender

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        manager = users.manager.address
        spender = users.spender.address
        token.approve(spender, 50, {from: manager})
      }).then(() => {
        return firstEvent(events)
      }).then((log) => {
        expect(log.args._owner).to.equal(manager)
        expect(log.args._spender).to.equal(spender)
        expect(log.args._amount.toNumber()).to.equal(50)
        done()
      })
    })
  })

  describe('#totalSupply', () => {
    contractShouldThrowIfEtherSent(() => {
      return token.setTotalSupply(10, {value: 1})
    })

    contractIt('should default to 10 million total supply', (done) => {
      Promise.resolve().then(() => {
        return token.totalSupply()
      }).then((max) => {
        expect(max.toNumber()).to.equal(10e6)
      }).then(done).catch(done)
    })

    contractIt('should not allow owner to issue more than max tokens', (done) => {
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
  })

  describe('#setTotalSupply', () => {
    contractIt('should allow owner to set totalSupply', (done) => {
      const newTotalSupply = 117

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        token.setTotalSupply(newTotalSupply, {from: users.alice.address})
      }).then(() => {
        return token.totalSupply()
      }).then((max) => {
        expect(max.toNumber()).to.equal(117)
      }).then(done).catch(done)
    })

    contractIt('should forbid non-owner from setting totalSupply', (done) => {
      const newTotalSupply = 117

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        token.setTotalSupply(newTotalSupply, {from: users.bob.address})
      }).then(() => {
        return token.totalSupply()
      }).then((max) => {
        expect(max.toNumber()).to.equal(10e6)
      }).then(done).catch(done)
    })
  })

  describe('#setOwner', () => {
    contractShouldThrowIfEtherSent(() => {
      return token.setOwner(accounts[1], {value: 1})
    })

    contractIt('should allow the owner to set a new owner', (done) => {
      let users

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((data) => {
        users = data
        token.setOwner(users.bob.address, {from: users.alice.address})
        return token.owner()
      }).then((newOwner) => {
        expect(newOwner.toString()).to.equal(users.bob.address)
      }).then(done).catch(done)
    })

    contractIt('should not allow other users to set a new owner', (done) => {
      let users

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((data) => {
        users = data
        token.setOwner(users.bob.address, {from: users.charlie.address})
        return token.owner()
      }).then((newOwner) => {
        expect(newOwner.toString()).to.not.equal(users.bob.address)
      }).then(done).catch(done)
    })
  })
})
