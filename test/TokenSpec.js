d = require('lightsaber').d

contract('Token', function(accounts) {

  it("constructor", function(done) {
    var token = Token.deployed()
    done()
  })

  it("should send tokens from one address to another", function(done) {
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
      return token.send(account_two, amount, {from: account_one})
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
