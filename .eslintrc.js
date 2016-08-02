module.exports = {
  "extends": [
    "standard"
  ],
  "parser": "babel-eslint",
  "plugins": [
    "promise"
  ],
  "rules": {
    "linebreak-style": [2, "unix"],
    "no-console": 1,
    "no-nested-ternary": 2,
    "no-unused-vars": [2,
      {
        "varsIgnorePattern": "^(contractItOnly|contractShouldThrowOnly|contractShouldThrowIfClosedOnly|contractShouldThrowIfEtherSentOnly|contractShouldThrowForNonOwnerOnly|Promise|d)$"
      }
    ],
    "no-var": 2,
    "promise/always-return": 2,
    "promise/no-native": 2,
    "strict": [2, "safe"]
  }
}
