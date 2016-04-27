contract Token {
  string public name;
  address public owner;
  uint256 public maxTokens;

  mapping (address => uint256) public balances;
  /*array addresses;*/

  /* public event on the blockchain that will notify clients */
  /*event Transfer(address indexed from, address indexed to, uint256 value);*/

  function Token() {
    owner = msg.sender; // contract owner is contract creator
    maxTokens = 10000000;
  }

  function setMaxTokens(uint256 _maxTokens) {
    if (msg.sender == owner) {
      maxTokens = _maxTokens;
    }
  }

  function setName(string _name) {
    if (msg.sender != owner) throw;
    name = _name;
  }

  function issue(address _to, uint256 _value) {
    if (msg.sender == owner && _value < maxTokens) {
      balances[_to] = _value;
    }
  }

  function transfer(address _to, uint256 _value) {
    if (balances[msg.sender] >= _value) {           // Check if the sender has enough*/
      if (balances[_to] + _value < balances[_to]) throw;  // Check for overflows

      balances[msg.sender] -= _value;                     // Subtract from the sender
      balances[_to] += _value;                            // Add the same to the recipient
    }
    /*Transfer(msg.sender, _to, _value);                   // Notify anyone listening that this transfer took place*/
  }

  function getBalance(address addr) returns(uint256) {
    return balances[addr];
  }

  /*function setOwner(string newOwner) {
    if (msg.sender != owner) throw;
    owner = newOwner;
  }*/

  /* This unnamed function is called whenever someone tries to transfer ether to it */
  function () {
    throw;     // Prevents accidental sending of ether
  }
}
