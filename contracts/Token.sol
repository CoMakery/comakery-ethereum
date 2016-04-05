contract Token {
  string public name;
  address public owner;
  uint256 public initialSupply;

  mapping (address => uint256) public balances;

  /* public event on the blockchain that will notify clients */
  /*event Transfer(address indexed from, address indexed to, uint256 value);*/

  /* Initializes contract with initial supply tokens to the creator of the contract */
  function Token() {
    owner = msg.sender;
    balances[owner] = 10000000;  // ten million
  }

  /*function setInitialSupply(uint256 _initialSupply) {
    if (msg.sender != owner) throw;
    if (initialSupply > 0) throw;
    if (_initialSupply < 0) throw;
    initialSupply = _initialSupply;
    balances[owner] = initialSupply;
  }*/

  function setName(string _name) {
    if (msg.sender != owner) throw;
    name = _name;
  }

  function send(address _to, uint256 _value) {
    if (balances[msg.sender] < _value) throw;           // Check if the sender has enough
    if (balances[_to] + _value < balances[_to]) throw;  // Check for overflows
    balances[msg.sender] -= _value;                     // Subtract from the sender
    balances[_to] += _value;                            // Add the same to the recipient
    /*return balances[_to];*/
    /*Transfer(msg.sender, _to, _value);                   // Notify anyone listening that this transfer took place*/
  }

  function getBalance(address addr) returns(uint256) {
    return balances[addr];
  }

  /* This unnamed function is called whenever someone tries to send ether to it */
  function () {
    throw;     // Prevents accidental sending of ether
  }
}
