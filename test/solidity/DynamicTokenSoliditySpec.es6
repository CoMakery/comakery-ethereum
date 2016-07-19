import {expect} from 'chai'
import {d} from 'lightsaber'
import Promise from 'bluebird'

const contractShouldThrowIfEtherSent = (functionToCall) => {
  contractShouldThrow('should throw an error if ether is sent', functionToCall)
}

const contractShouldThrowOnly = (description, functionToCall) => {
  contractShouldThrow(description, functionToCall, {only: true})
}

const contractShouldThrow = (description, functionToCall, options) => {
  contractIt(description, (done) => {
    Promise.resolve().then(functionToCall
    ).then(function () {
      throw new Error('Expected solidity error to be thown from contract, but was not')
    }).catch(function (error) {
      if (!error.message || error.message.search('invalid JUMP') < 0) throw error
    }).then(done).catch(done)
  }, options)
}

const contractItOnly = (name, func) => {
  contractIt(name, func, {only: true})
}

const contractIt = (name, func, options) => {
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
      return charlie.balance
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
      return token.issue(accounts[1], 10, 'proof1', {value: 1})
    })

    contractIt('should issue tokens to a user, increasing their balance', (done) => {
      const amount = 10
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return token.issue(starting.bob.address, amount, 'proof1', {from: starting.alice.address})
      }).then(() => {
        return token.issue(starting.bob.address, amount, 'proof2', {from: starting.alice.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(0)
        expect(ending.bob.balance).to.equal(amount * 2)
        return
      }).then(done).catch(done)
    })

    contractIt('should issue tokens only once for a given proof ID', (done) => {
      const amount = 10
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return token.issue(starting.bob.address, amount, 'proof-not-unique', {from: starting.alice.address})
      }).then(() => {
        return token.issue(starting.bob.address, amount, 'proof-not-unique', {from: starting.alice.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(0)
        expect(ending.bob.balance).to.equal(amount)  // not amount x 2
        return
      }).then(done).catch(done)
    })

    contractShouldThrow('should throw when value issued is a negative number', () => {
      return Promise.resolve().then(() => {
        return token.issue(accounts[0], 1, 'proof1')
      }).then(() => {
        return token.issue(accounts[0], -1, 'proof2')
      })
    })

    contractIt('should track totalSupply issued', (done) => {
      Promise.resolve().then(() => {
        return token.issue(accounts[0], 17, 'proof1')
      }).then(() => {
        return token.issue(accounts[1], 100, 'proof2')
      }).then(() => {
        return token.totalSupply.call()
      }).then((totalSupply) => {
        expect(totalSupply.toNumber()).to.equal(117)
        return
      }).then(done).catch(done)
    })

    contractIt('should only allow contract owner to issue new tokens', (done) => {
      const amount = 10
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return token.issue(starting.bob.address, amount, 'proof1', {from: starting.bob.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(0)
        expect(ending.bob.balance).to.equal(0)
        return
      }).then(done).catch(done)
    })

    contractShouldThrow('should throw an error if token balance overflows', () => {
      let MAXISH = 1e77  // max value of a uint256 is ~ 1.157920892373162e+77

      return Promise.resolve().then(() => {
        return token.setMaxSupply(MAXISH)
      }).then(() => {
        return token.issue(accounts[1], MAXISH, 'proof1')
      }).then(() => {
        return token.issue(accounts[1], MAXISH, 'proof2')
      })
    })

    contractIt('should fire an Issue on sucess', (done) => {
      let events = token.Issue()
      const amount = 10
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return token.issue(starting.bob.address, amount, 'proof1', {from: starting.alice.address})
      }).then(() => {
        return firstEvent(events)
      }).then((log) => {
        expect(log.args._from).to.equal(starting.alice.address)
        expect(log.args._to).to.equal(starting.bob.address)
        expect(log.args._proofId).to.equal('proof1')
        expect(log.args._value.toNumber()).to.equal(amount)
        done()
        return
      })
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
        return token.issue(starting.alice.address, 20, 'proof1', {from: starting.alice.address})
      }).then(() => {
        return token.transfer(starting.bob.address, 5, {from: starting.alice.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(15)
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
        return token.issue(starting.alice.address, 20, 'proof1', {from: starting.alice.address})
      }).then(() => {
        return token.transfer(starting.bob.address, 5, {from: starting.alice.address})
      }).then(() => {
        return token.transfer(starting.charlie.address, 5, {from: starting.bob.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(15)
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
        return token.issue(starting.alice.address, 20, 'proof1', {from: starting.alice.address})
      }).then(() => {
        return token.transfer(starting.bob.address, 5, {from: starting.alice.address})
      }).then(() => {
        return token.transfer(starting.charlie.address, 5, {from: starting.bob.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(15)
        expect(ending.bob.balance).to.equal(0)
        expect(ending.charlie.balance).to.equal(5)
        return
      }).then(done).catch(done)
    })

    contractIt('should fire a Transfer event when a tranfer is sucessful', (done) => {
      let events = token.Transfer()
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return token.issue(starting.alice.address, 20, 'proof1', {from: starting.alice.address})
      }).then(() => {
        return token.transfer(starting.bob.address, 5, {from: starting.alice.address})
      }).then(() => {
        return firstEvent(events)
      }).then((log) => {
        expect(log.args._from).to.equal(starting.alice.address)
        expect(log.args._to).to.equal(starting.bob.address)
        expect(log.args._amount.toNumber()).to.equal(5)
        done()
        return
      })
    })

    contractIt('should do nothing if sender does not have enough tokens', (done) => {
      const amount = 10
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return token.transfer(starting.alice.address, amount, {from: starting.bob.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(starting.alice.balance)
        expect(ending.bob.balance).to.equal(starting.bob.balance)
        return
      }).then(done).catch(done)
    })

    contractIt('should do nothing if a the send value is a negative number', (done) => {
      const amount = -1
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return token.transfer(starting.bob.address, amount, {from: starting.alice.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(starting.alice.balance)
        expect(ending.bob.balance).to.equal(starting.bob.balance)
        return
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
        return token.issue(manager, 200, 'proof1', {from: manager})
      }).then(() => {
        return token.approve(spender, 100, {from: manager})
      }).then(() => {
        return token.transferFrom(manager, recipient, 40, {from: spender})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.manager.balance).to.equal(160)
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

    contractIt('spender cannot spend without allowance set by manager', (done) => {
      let manager, spender, recipient

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        manager = users.manager.address
        spender = users.spender.address
        recipient = users.recipient.address
        return token.issue(manager, 200, 'proof1', {from: manager})
      }).then(() => {
        return token.transferFrom(manager, recipient, 40, {from: spender})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.manager.balance).to.equal(200)
        expect(ending.spender.balance).to.equal(0)
        expect(ending.recipient.balance).to.equal(0)
        return
      }).then(() => {
        return token.allowance.call(manager, spender, {from: anyone})
      }).then((allowance) => {
        expect(allowance.toNumber()).to.equal(0)
        return
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
        return token.issue(manager, 200, 'proof1', {from: manager})
      }).then(() => {
        return token.approve(spender, 100, {from: manager})
      }).then(() => {
        return token.transferFrom(manager, recipient, 50, {from: spender})
      }).then(() => {
        return firstEvent(events)
      }).then((log) => {
        expect(log.args._from).to.equal(manager)
        expect(log.args._to).to.equal(recipient)
        expect(log.args._amount.toNumber()).to.equal(50)
        done()
        return
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
        return token.issue(manager, 200, 'proof1', {from: manager})
      }).then(() => {
        return token.approve(spender, 100, {from: manager})
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
        return
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
        return token.issue(manager, 200, 'proof1', {from: manager})
      }).then(() => {
        return token.approve(spender, 100, {from: manager})
      }).then(() => {
        return token.transferFrom(manager, recipient, 101, {from: spender})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.manager.balance).to.equal(200)
        expect(ending.spender.balance).to.equal(0)
        expect(ending.recipient.balance).to.equal(0)
        return
      }).then(() => {
        return token.allowance.call(manager, spender, {from: anyone})
      }).then((allowance) => {
        expect(allowance.toNumber()).to.equal(100)
        return
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
        return token.issue(manager, 100, 'proof1', {from: manager})
      }).then(() => {
        return token.approve(spender, 300, 'proof2', {from: manager})
      }).then(() => {
        return token.transferFrom(manager, recipient, 200, {from: spender})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.manager.balance).to.equal(100)
        expect(ending.spender.balance).to.equal(0)
        expect(ending.recipient.balance).to.equal(0)
        return
      }).then(() => {
        return token.allowance.call(manager, spender, {from: anyone})
      }).then((allowance) => {
        expect(allowance.toNumber()).to.equal(300)
        return
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
        return token.issue(manager, 100, 'proof1', {from: manager})
      }).then(() => {
        return token.issue(recipient, 100, 'proof2', {from: manager})
      }).then(() => {
        return token.approve(spender, 100, {from: manager})
      }).then(() => {
        return token.approve(spender, 100, {from: recipient})
      }).then(() => {
        return token.transferFrom(manager, recipient, -1, {from: spender})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.manager.balance).to.equal(100)
        expect(ending.spender.balance).to.equal(0)
        expect(ending.recipient.balance).to.equal(100)
        return
      }).then(() => {
        return token.allowance.call(manager, spender, {from: anyone})
      }).then((allowance) => {
        expect(allowance.toNumber()).to.equal(100)
        return
      }).then(() => {
        return token.allowance.call(recipient, spender, {from: anyone})
      }).then((allowance) => {
        expect(allowance.toNumber()).to.equal(100)
        return
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
        return token.approve(spender, 100, {from: manager})
      }).then(() => {
        return token.allowance.call(manager, spender, {from: anyone})
      }).then((allowance) => {
        expect(allowance.toNumber()).to.equal(100)
        return
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
        return token.approve(spender, 50, {from: manager})
      }).then(() => {
        return firstEvent(events)
      }).then((log) => {
        expect(log.args._owner).to.equal(manager)
        expect(log.args._spender).to.equal(spender)
        expect(log.args._amount.toNumber()).to.equal(50)
        done()
        return
      })
    })
  })

  describe('#maxSupply', () => {
    contractShouldThrowIfEtherSent(() => {
      return token.setMaxSupply(10, {value: 1})
    })

    contractIt('should default to 10 million total supply', (done) => {
      Promise.resolve().then(() => {
        return token.maxSupply()
      }).then((max) => {
        expect(max.toNumber()).to.equal(10e6)
        return
      }).then(done).catch(done)
    })

    contractIt('should not allow owner to issue more than max tokens', (done) => {
      const halfAmount = 6e6
      let starting

      // Issue in halfAmount twice. Don't issue the second amount which is over the maxSupply
      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return token.issue(starting.bob.address, halfAmount, 'proof1', {from: starting.alice.address})
      }).then(() => {
        return token.issue(starting.bob.address, halfAmount, 'proof2', {from: starting.alice.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(0)
        expect(ending.bob.balance).to.equal(halfAmount)
        return
      }).then(done).catch(done)
    })

    contractIt('should allow owner to issue max tokens', (done) => {
      const amount = 10e6
      let starting

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        starting = users
        return token.issue(starting.bob.address, amount, 'proof1', {from: starting.alice.address})
      }).then(() => {
        return getUsers(token)
      }).then((ending) => {
        expect(ending.alice.balance).to.equal(0)
        expect(ending.bob.balance).to.equal(10e6)
        return
      }).then(done).catch(done)
    })
  })

  describe('#setMaxSupply', () => {
    contractIt('should allow owner to set maxSupply', (done) => {
      const newTotalSupply = 117

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        return token.setMaxSupply(newTotalSupply, {from: users.alice.address})
      }).then(() => {
        return token.maxSupply()
      }).then((max) => {
        expect(max.toNumber()).to.equal(117)
        return
      }).then(done).catch(done)
    })

    contractShouldThrow('should not allow maxSupply to be set less than total supply', () => {
      return Promise.resolve().then(() => {
        return token.issue(accounts[0], 10, 'proof1')
      }).then(() => {
        return token.setMaxSupply(1)
      })
    })

    contractIt('should forbid non-owner from setting maxSupply', (done) => {
      const newTotalSupply = 117

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        return token.setMaxSupply(newTotalSupply, {from: users.bob.address})
      }).then(() => {
        return token.maxSupply()
      }).then((max) => {
        expect(max.toNumber()).to.equal(10e6)
        return
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
        return token.setOwner(users.bob.address, {from: users.alice.address})
      }).then(() => {
        return token.owner()
      }).then((newOwner) => {
        expect(newOwner.toString()).to.equal(users.bob.address)
        return
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
        return
      }).then(done).catch(done)
    })
  })

  describe('#getAccounts accessbile by everyone', () => {
    contractShouldThrowIfEtherSent(() => {
      return token.getAccounts({value: 1})
    })

    contractIt('includes accounts that are issued tokens without duplicates', (done) => {
      let expected = [accounts[2]]

      Promise.resolve().then(() => {
        return token.issue(accounts[2], 20, 'proof1')
      }).then(() => {
        return token.issue(accounts[2], 25, 'proof2')
      }).then(() => {
        return token.getAccounts.call()
      }).then((tokenAccounts) => {
        expect(tokenAccounts.length).to.equal(expected.length)
        expect(tokenAccounts).to.have.members(expected)
        return
      }).then(done).catch(done)
    })

    contractIt('includes accounts that are transfered tokens without duplicates', (done) => {
      let expected = [accounts[0], accounts[2]]

      Promise.resolve().then(() => {
        return token.issue(accounts[0], 2000, 'proof1')
      }).then(() => {
        return token.transfer(accounts[2], 20)
      }).then(() => {
        return token.transfer(accounts[2], 25)
      }).then(() => {
        return token.getAccounts.call()
      }).then((tokenAccounts) => {
        expect(expected).to.have.members(tokenAccounts)
        expect(tokenAccounts.length).to.equal(expected.length)
        return
      }).then(done).catch(done)
    })

    contractIt('includes accounts that are transferedFrom tokens without duplicates', (done) => {
      let manager, spender, recipient

      Promise.resolve().then(() => {
        return getUsers(token)
      }).then((users) => {
        manager = users.manager.address
        spender = users.spender.address
        recipient = users.recipient.address
        return token.issue(manager, 200, 'proof1', {from: manager})
      }).then(() => {
        return token.approve(spender, 100, {from: manager})
      }).then(() => {
        return token.transferFrom(manager, recipient, 50, {from: spender})
      }).then(() => {
        return token.getAccounts.call()
      }).then((tokenAccounts) => {
        let expected = [manager, recipient]
        expect(tokenAccounts).to.have.members(expected)
        return
      }).then(done).catch(done)
    })
  })

  contractIt('#indexAccount should be private', (done) => {
    expect(token.indexAccount).to.equal(undefined)
    done()
  })

  describe('#burn', () => {
    contractShouldThrowIfEtherSent(() => {
      return token.burn(accounts[1], 5, {from: accounts[0], value: 1})
    })

    contractShouldThrow('should throw an error if called by a non-owner', () => {
      return token.burn(accounts[0], 10, {from: accounts[1]})
    })

    contractIt('burns tokens from an address', (done) => {
      let bob = accounts[1]
      Promise.resolve().then(() => {
        return token.issue(bob, 11, 'proof1', {from: accounts[0]})
      }).then(() => {
        return token.totalSupply.call()
      }).then((totalSupply) => {
        expect(totalSupply.toNumber()).to.equal(11)
        return
      }).then(() => {
        return token.burn(bob, 10, {from: accounts[0]})
      }).then(() => {
        return token.balanceOf.call(bob)
      }).then((balance) => {
        expect(balance.toNumber()).to.equal(1)
        return token.totalSupply.call()
      }).then((totalSupply) => {
        expect(totalSupply.toNumber()).to.equal(1)
        return
      }).then(done).catch(done)
    })

    contractIt('burns no tokens if amount is greater than the from address balance', (done) => {
      let bob = accounts[1]
      Promise.resolve().then(() => {
        return token.issue(bob, 1, 'proof1', {from: accounts[0]})
      }).then(() => {
        return token.totalSupply.call()
      }).then((totalSupply) => {
        return expect(totalSupply.toNumber()).to.equal(1)
      }).then(() => {
        return token.burn(bob, 10, {from: accounts[0]})
      }).then(() => {
        return token.balanceOf.call(bob)
      }).then((balance) => {
        expect(balance.toNumber()).to.equal(1)
        return token.totalSupply.call()
      }).then((totalSupply) => {
        expect(totalSupply.toNumber()).to.equal(1)
        return
      }).then(done).catch(done)
    })
  })

  // This kills the server unless it runs last...
  describe('#close', () => {
    contractShouldThrowIfEtherSent(() => {
      return token.close({value: 1})
    })

    contractShouldThrow('should throw an error if called by a non-owner', () => {
      return token.close({from: accounts[1]})
    })

    contractIt('owner can self destruct the contract', (done) => {
      Promise.resolve().then(() => {
        return token.owner()
      }).then((owner) => {
        expect(owner).to.equal(accounts[0])
        return
      }).then(() => {
        return token.close()
      }).then(() => {
        return token.owner()
      }).then((owner) => {
        expect(owner).to.equal('0x')
        return
      }).then(done).catch(done)
    })
  })
})

/* Declare global variables for eslint to ignore: */
/* global beforeEach */
/* global contract */
/* global describe */
/* global it */
/* global DynamicToken */
