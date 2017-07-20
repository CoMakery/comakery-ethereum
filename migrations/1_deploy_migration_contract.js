const Migrations = artifacts.require('Migrations.sol')

module.exports = function(deployer) {
  deployer.deploy(Migrations)
}

/* Declare global variables for eslint to ignore: */
/* global Migrations */
