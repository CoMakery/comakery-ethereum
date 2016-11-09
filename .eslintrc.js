const unusedVars = [
  'contractItOnly',
  'contractShouldThrowForNonOwnerOnly',
  'contractShouldThrowIfClosed',
  'contractShouldThrowIfClosedOnly',
  'contractShouldThrowIfEtherSentOnly',
  'contractShouldThrowOnly',
  'd'
]

const config = {
  extends: [
    'standard'
  ],
  env: {
    node: true
  },
  globals: {
    beforeEach: true,
    contract: true,
    describe: true,
    DynamicToken: true,
    it: true,
    Promise: true,
    xit: true
  },
  parser: 'babel-eslint',
  plugins: [
    'promise'
  ],
  rules: {
    'linebreak-style': [2, 'unix'],
    'no-console': 1,
    'no-nested-ternary': 2,
    'no-unused-vars': [2, { 'varsIgnorePattern': '^(' + unusedVars.join('|') + ')$' }],
    'no-var': 2,
    'object-property-newline': 0, // disable "standard" rule
    'promise/always-return': 2,
    'strict': [2, 'safe']
  }
}

module.exports = config