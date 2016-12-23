const unusedVars = [
  'contractItOnly',
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
    'beforeEach': false,
    'contract': false,
    'describe': false,
    'DynamicToken': false,
    'it': false,
    'Promise': false,
    'xit': false,
  },

  'rules': {
    'no-unused-vars': [2, { 'varsIgnorePattern': '^(' + unusedVars.join('|') + ')$' }],
  },
}

module.exports = config
