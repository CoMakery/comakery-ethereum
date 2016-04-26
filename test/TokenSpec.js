d = require('lightsaber').d

contract('Token', function(accounts) {

  it("constructor", function(done) {
    var token = Token.deployed()
    done()
  })

  it("should do nothing and return the gas if sender doesn't have enough tokens", function(done) {
    var token = Token.deployed()

    var sender = accounts[1]
    var receiver = accounts[0]

    var receiver_starting_balance
    var sender_starting_balance
    var receiver_ending_balance
    var sender_ending_balance

    var amount = 10

    Promise.resolve().then(function() {
      return token.getBalance.call(receiver)
    }).then(function(balance) {
      receiver_starting_balance = balance.toNumber()
      return token.getBalance.call(sender)
    }).then(function(balance) {
      sender_starting_balance = balance.toNumber()
      assert.equal(sender_starting_balance,0)
      return token.transfer(receiver, amount, {from: sender})
    }).then(function() {
      return token.getBalance.call(receiver)
    }).then(function(balance) {
      receiver_ending_balance = balance.toNumber()
      return token.getBalance.call(sender)
    }).then(function(balance) {
      sender_ending_balance = balance.toNumber()

      assert.equal(receiver_ending_balance, receiver_starting_balance, "Receiver balance should not change")
      assert.equal(sender_ending_balance, sender_starting_balance, "Sender balance should not change")
    }).then(done).catch(done)

  })

  it("should transfer tokens from one address to another", function(done) {
    var token = Token.deployed()

    // Get initial balances of first and second account.
    var account_one = accounts[0]
    var account_two = accounts[1]

    var account_one_starting_balance
    var account_two_starting_balance
    var account_one_ending_balance
    var account_two_ending_balance

    var amount = 10

    Promise.resolve().then(function() {
      return token.getBalance.call(account_one)
    }).then(function(balance) {
      account_one_starting_balance = balance.toNumber()
      return token.getBalance.call(account_two)
    }).then(function(balance) {
      account_two_starting_balance = balance.toNumber()
      return token.transfer(account_two, amount, {from: account_one})
    }).then(function() {
      return token.getBalance.call(account_one)
    }).then(function(balance) {
      account_one_ending_balance = balance.toNumber()
      return token.getBalance.call(account_two)
    }).then(function(balance) {
      account_two_ending_balance = balance.toNumber()

      assert.equal(account_one_ending_balance, account_one_starting_balance - amount, "Amount wasn't correctly taken from the sender")
      assert.equal(account_two_ending_balance, account_two_starting_balance + amount, "Amount wasn't correctly sent to the receiver")
    }).then(done).catch(done)
  })
})
