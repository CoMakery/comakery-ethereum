contract TokenInterface {
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;

    /// Total amount of tokens
    uint256 public totalSupply;

    /// @param _owner The address from which the balance will be retrieved
    /// @return The balance
    function balanceOf(address _owner) constant returns (uint256 balance);

    /// @notice Send `_amount` tokens to `_to` from `msg.sender`
    /// @param _to The address of the recipient
    /// @param _amount The amount of tokens to be transferred
    /// @return Whether the transfer was successful or not
    function transfer(address _to, uint256 _amount) returns (bool success);

    /* TODO: THIS LATER!
    /// @notice Send `_amount` tokens to `_to` from `_from` on the condition it
    /// is approved by `_from`
    /// @param _from The address of the origin of the transfer
    /// @param _to The address of the recipient
    /// @param _amount The amount of tokens to be transferred
    /// @return Whether the transfer was successful or not
    function transferFrom(address _from, address _to, uint256 _amount) returns (bool success);
    */

    /*
    /// @notice `msg.sender` approves `_spender` to spend `_amount` tokens on
    /// its behalf
    /// @param _spender The address of the account able to transfer the tokens
    /// @param _amount The amount of tokens to be approved for transfer
    /// @return Whether the approval was successful or not
    function approve(address _spender, uint256 _amount) returns (bool success);

    /// @param _owner The address of the account owning tokens
    /// @param _spender The address of the account able to transfer the tokens
    /// @return Amount of remaining tokens of _owner that _spender is allowed
    /// to spend
    function allowance(
        address _owner,
        address _spender
    ) constant returns (uint256 remaining);

    event Transfer(address indexed _from, address indexed _to, uint256 _amount);
    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _amount
    );*/
}

/*string public version;   // eg comakery-token-v1.0 */

contract Token is TokenInterface {
  address public owner;

  /* public event on the blockchain that will notify clients */
  event Transfer(address indexed from, address indexed to, uint256 value);

  function Token() {
    owner = msg.sender; // contract owner is contract creator
    totalSupply = 10000000;
  }

  // owner functions ----------------------------
  modifier onlyOwner {
    if (msg.sender == owner) {
      _
    }
  }

  function setTotalSupply(uint256 _totalSupply) onlyOwner {
      totalSupply = _totalSupply;
  }

  function issue(address _to, uint256 _value) onlyOwner {
    if (_value <= totalSupply) {
      balances[_to] = _value;
    }
  }

  function setOwner(address _newOwner) onlyOwner {
    owner = _newOwner;
  }

  // user functions -------------------------------
  function transfer(address _to, uint256 _amount) returns (bool success) {
    if (balances[msg.sender] >= _amount) {           // Check if the sender has enough*/
      if (balances[_to] + _amount < balances[_to]) throw;  // Check for overflows

      balances[msg.sender] -= _amount;                     // Subtract from the sender
      balances[_to] += _amount;                            // Add the same to the recipient
      Transfer(msg.sender, _to, _amount);                   // Notify anyone listening that this transfer took place
      return true;
    } else {
      return false;
    }
  }

  function balanceOf(address _owner) constant returns(uint256 balance) {
    return balances[_owner];
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
