// Implements standard token interface
// From: https://github.com/slockit/DAO/blob/f640568e694a057aaeb64a0f1049fae27efe818b/Token.sol
// See also https://github.com/ethereum/wiki/wiki/Standardized_Contract_APIs

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

    /// @notice Send `_amount` tokens to `_to` from `_from` on the condition it
    /// is approved by `_from`
    /// @param _from The address of the origin of the transfer
    /// @param _to The address of the recipient
    /// @param _amount The amount of tokens to be transferred
    /// @return Whether the transfer was successful or not
    function transferFrom(address _from, address _to, uint256 _amount) returns (bool success);

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
    );
}

/*string public version;   // eg comakery-token-v1.0 */

contract Token is TokenInterface {
  address public owner;

  // Protects users by preventing the execution of method calls that
  // inadvertently also transferred ether
  modifier noEther() {if (msg.value > 0) throw; _}

  event TransferFrom(address indexed _from, address indexed _to,  address indexed _spender, uint256 _amount);

  function Token() {
    owner = msg.sender; // contract owner is contract creator
    totalSupply = 10000000;
  }

  modifier onlyOwner {
    if (msg.sender == owner) {
      _
    }
  }

  function setTotalSupply(uint256 _totalSupply) onlyOwner noEther {
    totalSupply = _totalSupply;
  }

  function issue(address _to, uint256 _value) onlyOwner noEther {
    if (_value <= totalSupply) {
      balances[_to] = _value;
    }
  }

  function setOwner(address _newOwner) onlyOwner noEther {
    owner = _newOwner;
  }

  function transfer(address _to, uint256 _amount) noEther returns (bool success) {
    if (balances[msg.sender] >= _amount) {
      if (balances[_to] + _amount < balances[_to]) throw;  // Check for overflows

      balances[msg.sender] -= _amount;
      balances[_to] += _amount;
      Transfer(msg.sender, _to, _amount);
      return true;
    } else {
      return false;
    }
  }

  function balanceOf(address _owner) noEther constant returns(uint256 balance) {
    return balances[_owner];
  }

  function approve(address _spender, uint256 _amount) noEther returns (bool success) {
    // if (amount <= 0) return false; // TODO can we test this?
    allowed[msg.sender][_spender] = _amount;
    Approval(msg.sender, _spender, _amount);
    return true;
  }

  function allowance(address _owner, address _spender) noEther constant returns (uint256 remaining) {
    return allowed[_owner][_spender];
  }

  function transferFrom(address _from, address _to, uint256 _amount) noEther returns (bool success) {
    if (balances[_from] >= _amount
      && allowed[_from][msg.sender] >= _amount
      // && _amount > 0) {  -- FIXME the test passes without this, why?
      ) {
        balances[_to] += _amount;
        balances[_from] -= _amount;
        allowed[_from][msg.sender] -= _amount;
        Transfer(_from, _to, _amount);
        TransferFrom(_from, _to, msg.sender, _amount);
        // TODO should we have a TransferFrom event too???
        return true;
    } else {
      return false;
    }
  }

  /*TODO*/
  /*function destroy() onlyOwner {
    suicide(owner);
  }*/

}
