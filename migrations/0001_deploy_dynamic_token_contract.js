const DynamicToken = artifacts.require('DynamicToken.sol')

module.exports = function(deployer) {
  deployer.deploy(DynamicToken)
}
