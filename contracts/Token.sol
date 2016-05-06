contract TokenInterface {
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;

    uint256 public totalSupply;

    function balanceOf(address _owner) constant returns (uint256 balance);
    function transfer(address _to, uint256 _amount) returns (bool success);

    /* TODO: THIS LATER!
    function transferFrom(address _from, address _to, uint256 _amount) returns (bool success);
    */
    function approve(address _spender, uint256 _amount) returns (bool success);
    function allowance(address _owner, address _spender) constant returns (uint256 remaining);

    event Transfer(address indexed _from, address indexed _to, uint256 _amount);
    /* event Approval(address indexed _owner,address indexed _spender,uint256 _amount);*/
}

/*string public version;   // eg comakery-token-v1.0 */

contract Token is TokenInterface {
  address public owner;

  // Protects users by preventing the execution of method calls that
  // inadvertently also transferred ether
  // TODO:
  //  modifier noEther() {if (msg.value > 0) throw; _}

  /* public event on the blockchain that will notify clients */

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

  /*function transferFrom(address _from, address _to, uint256 _amount) noEther returns (bool success) {
    if (balances[_from] >= _amount
      && allowed[_from][msg.sender] >= _amount
      && _amount > 0) {

      balances[_to] += _amount;
      balances[_from] -= _amount;
      allowed[_from][msg.sender] -= _amount;
      Transfer(_from, _to, _amount);
      return true;
    } else {
      return false;
    }
  }*/

  function approve(address _spender, uint256 _amount) returns (bool success) {
    allowed[msg.sender][_spender] = _amount;
    /*Approval(msg.sender, _spender, _amount);*/
    return true;
  }

  function allowance(address _owner, address _spender) constant returns (uint256 remaining) {
    return allowed[_owner][_spender];
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
