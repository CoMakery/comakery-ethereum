contract Token {  // ComakeryToken ??
  address public owner;
  uint256 public maxTokens;
  /*string public version;   // eg comakery-token-v1.0 */

  mapping (address => uint256) public balances;

  /* public event on the blockchain that will notify clients */
  event Transfer(address indexed from, address indexed to, uint256 value);

  function Token() {
    owner = msg.sender; // contract owner is contract creator
    maxTokens = 10000000;
  }

  // owner functions ----------------------------
  modifier onlyOwner {
    if (msg.sender == owner) {
      _
    }
  }

  function setMaxTokens(uint256 _maxTokens) onlyOwner {
      maxTokens = _maxTokens;
  }

  function issue(address _to, uint256 _value) onlyOwner {
    if (_value <= maxTokens) {
      balances[_to] = _value;
    }
  }

  function setOwner(address _newOwner) onlyOwner {
    owner = _newOwner;
  }

  // user functions -------------------------------
  function transfer(address _to, uint256 _value) {
    if (balances[msg.sender] >= _value) {           // Check if the sender has enough*/
      if (balances[_to] + _value < balances[_to]) throw;  // Check for overflows

      balances[msg.sender] -= _value;                     // Subtract from the sender
      balances[_to] += _value;                            // Add the same to the recipient
      Transfer(msg.sender, _to, _value);                   // Notify anyone listening that this transfer took place

    }
  }

  function getBalance(address _addr) returns(uint256) {
    return balances[_addr];
  }

  /*TODO*/
  /*function destroy() onlyOwner {
    suicide(owner);
  }*/

  /* This unnamed function is called whenever someone tries to transfer ether to it */
  function () {
    throw;     // Prevents accidental sending of ether
  }
}
