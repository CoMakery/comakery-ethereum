const unusedVars = [
  'contractItOnly',
  'contractShouldThrow',
  'contractShouldThrowForNonOwner',
  'contractShouldThrowForNonOwnerOnly',
  'contractShouldThrowIfClosed',
  'contractShouldThrowIfClosedOnly',
  'contractShouldThrowIfEtherSentOnly',
  'contractShouldThrowOnly',
  'd',
]

const config = {
  'extends': 'comakery',

  'globals': {
    'artifacts': false,
    'beforeEach': false,
    'contract': false,
    'describe': false,
    'DynamicToken': false,
    'it': false,
    'Promise': false,
    'xit': false,
  },

  'rules': {
    'complexity': [2, 5],
    'no-unused-vars': [2, { 'varsIgnorePattern': '^(' + unusedVars.join('|') + ')$' }],
  },
}

module.exports = config
