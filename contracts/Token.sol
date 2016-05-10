contract TokenInterface {
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;

    uint256 public totalSupply;

    function balanceOf(address _owner) constant returns (uint256 balance);
    function transfer(address _to, uint256 _amount) returns (bool success);

    function transferFrom(address _from, address _to, uint256 _amount) returns (bool success);
    function approve(address _spender, uint256 _amount) returns (bool success);
    function allowance(address _owner, address _spender) constant returns (uint256 remaining);

    event Transfer(address indexed _from, address indexed _to, uint256 _amount);
    event Approval(address indexed _owner,address indexed _spender,uint256 _amount);
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
