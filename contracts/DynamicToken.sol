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

contract DynamicToken is TokenInterface {
  address public owner;
  address[] public accounts;
  mapping (address => bool) public accountExists;
  string[] public proofIds;
  mapping (string => bool) proofIdExists;
  uint256 public maxSupply;
  bool public closed;

  // Protects users by preventing the execution of method calls that
  // inadvertently also transferred ether
  modifier noEther() {if (msg.value > 0) throw; _}

  event TransferFrom(address indexed _from, address indexed _to,  address indexed _spender, uint256 _amount);
  event Issue(address _from, address _to, uint256 _amount, string _proofId);
  event Burn(address _burnFrom, uint _amount, address _burner);
  event Close(address _closedBy);

  function DynamicToken() {
    owner = msg.sender;     // contract owner is contract creator
    closed = false;
    maxSupply = 10**7;
    totalSupply = 0;
  }

  modifier onlyOwner {
    if (msg.sender != owner) throw;
    _
  }

  modifier notClosed {
    if (closed) throw;
    _
  }

  // accessors

  function getAccounts() noEther constant returns (address[] _accounts) {
    return accounts;
  }

  function balanceOf(address _owner) noEther constant returns(uint256 balance) {
    return balances[_owner];
  }

  function allowance(address _owner, address _spender) noEther constant returns (uint256 remaining) {
    return allowed[_owner][_spender];
  }

  // mutators

  function issue(address _to, uint256 _amount, string _proofId) notClosed onlyOwner noEther {
    if (proofIdExists[_proofId]) return;
    if (balances[_to] + _amount < balances[_to]) throw; // Check for overflows
    if (totalSupply + _amount <= maxSupply) {
      balances[_to] += _amount;
      totalSupply += _amount;
      _indexAccount(_to);
      _indexProofId(_proofId);
      Issue(owner, _to, _amount, _proofId);
    }
  }

  function setMaxSupply(uint256 _maxSupply) notClosed onlyOwner noEther {
    if (_maxSupply < totalSupply) throw;
    maxSupply = _maxSupply;
  }

  function setOwner(address _newOwner) notClosed onlyOwner noEther {
    owner = _newOwner;
  }

  function transfer(address _to, uint256 _amount) notClosed noEther returns (bool success) {
    return _transfer(msg.sender, _to, _amount);
  }

  function approve(address _spender, uint256 _amount) notClosed noEther returns (bool success) {
    allowed[msg.sender][_spender] = _amount;
    Approval(msg.sender, _spender, _amount);
    return true;
  }

  function transferFrom(address _from, address _to, uint256 _amount) notClosed noEther returns (bool success) {
    if (allowed[_from][msg.sender] >= _amount &&
      _transfer(_from, _to, _amount)) {
      allowed[_from][msg.sender] -= _amount;
      TransferFrom(_from, _to, msg.sender, _amount);
      return true;
    } else {
      return false;
    }
  }

  function burn(address _burnFrom, uint256 _amount) notClosed onlyOwner noEther returns (bool success) {
    if (balances[_burnFrom] >= _amount) {
      balances[_burnFrom] -= _amount;
      totalSupply -= _amount;
      Burn(_burnFrom, _amount, owner);
      return true;
    } else {
      return false;
    }
  }

  /*function upgrade(address _replacementContract) onlyOwner noEther returns (bool success) {
    supplantedBy = _replacementContract
    close();
    Upgrade(_replacementContract);
  }*/

  function close() notClosed onlyOwner noEther returns (bool success) {
    closed = true;
    Close(owner);
  }


  function destroyContract() onlyOwner noEther {
    selfdestruct(owner);
  }

  // private mutators

  function _transfer(address _from, address _to, uint256 _amount) notClosed private returns (bool success) {
    if (balances[_to] + _amount < balances[_to]) throw;  // Check for overflows

    if (balances[_from] >= _amount) {
      balances[_to] += _amount;
      balances[_from] -= _amount;
      _indexAccount(_to);
      Transfer(_from, _to, _amount);
      return true;
    } else {
      return false;
    }
  }

  function _indexAccount(address _account) private {
    if (accountExists[_account]) return;
    accountExists[_account] = true;
    accounts.push(_account);
  }

  function _indexProofId(string _proofId) private {
    if (proofIdExists[_proofId]) return;
    proofIdExists[_proofId] = true;
    proofIds.push(_proofId);
  }

  // throw on malformed calls
  function () {
    throw;
  }
}
