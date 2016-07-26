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
  bool public isClosed;
  bool public isMaxSupplyLocked;
  bool public isLockedOpen;
  bool public isContractOwnerLocked;

  uint256 public maxSupply;

  address public upgradedContract;
  address public contractOwner;
  address[] public accounts;

  string[] public proofIds;

  mapping (address => bool) public accountExists;
  mapping (string => bool) proofIdExists;

  event TransferFrom(address indexed _from, address indexed _to,  address indexed _spender, uint256 _amount);
  event Issue(address indexed _from, address indexed _to, uint256 _amount, string _proofId);
  event Burn(address indexed _burnFrom, uint256 _amount);
  event Close(address indexed _closedBy);
  event Upgrade(address indexed _upgradedContract);
  event LockOpen(address indexed _by);
  event LockContractOwner(address indexed _by);
  event TransferContractOwnership(address indexed _by, address indexed _to);
  event MaxSupply(address indexed _by, uint256 _newMaxSupply, bool _isMaxSupplyLocked);

  function DynamicToken() {
    contractOwner = msg.sender;     // contract owner is contract creator
    maxSupply = 10**7;
    totalSupply = 0;

    isClosed = false;
    isMaxSupplyLocked = false;
    isLockedOpen = false;
    isContractOwnerLocked = false;
  }

  // restrict usage to only the owner
  modifier onlyContractOwner {
    if (msg.sender != contractOwner) throw;
    _
  }

  // check if the contract has been closed
  modifier notClosed {
    if (isClosed) throw;
    _
  }

  modifier notLockedOpen {
    if (isLockedOpen) throw;
    _
  }

  // no ether should be transfered to this contract
  modifier noEther() {if (msg.value > 0) throw; _}

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

  // TOKEN MUTATORS

  // tokens are only issued in exchange for a unique proof of contribution
  function issue(address _to, uint256 _amount, string _proofId) notClosed onlyContractOwner noEther returns (bool success) {
    if (balances[_to] + _amount < balances[_to]) throw; // Guard against overflow
    if (totalSupply + _amount < totalSupply) throw;     // Guard against overflow  (this should never happen)

    if (proofIdExists[_proofId]) return false;
    if (totalSupply + _amount > maxSupply) return false;

    balances[_to] += _amount;
    totalSupply += _amount;
    _indexAccount(_to);
    _indexProofId(_proofId);
    Issue(msg.sender, _to, _amount, _proofId);
    return true;
  }

  function setMaxSupply(uint256 _maxSupply) notClosed onlyContractOwner noEther returns (bool success) {
    if (_maxSupply < totalSupply) throw;
    if (isMaxSupplyLocked) return false;

    maxSupply = _maxSupply;
    MaxSupply(msg.sender, _maxSupply, isMaxSupplyLocked);
    return true;
  }

  // lock the maxSupply to its current value forever
  function lockMaxSupply() notClosed onlyContractOwner noEther returns(bool success) {
    isMaxSupplyLocked = true;
    MaxSupply(msg.sender, maxSupply, isMaxSupplyLocked);
    return true;
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
    if (_amount > allowed[_from][msg.sender]) return false;

    if (allowed[_from][msg.sender] - _amount > allowed[_from][msg.sender]) throw;  // Guard against underflow

    if (_transfer(_from, _to, _amount)) {
      allowed[_from][msg.sender] -= _amount;
      TransferFrom(_from, _to, msg.sender, _amount);
      return true;
    } else {
      return false;
    }
  }

  function burn(uint256 _amount) notClosed noEther returns (bool success) {
    if (_amount > balances[msg.sender]) return false;

    if (_amount > totalSupply) throw;
    if (balances[msg.sender] - _amount > balances[msg.sender]) throw;     // Guard against underflow
    if (totalSupply - _amount > totalSupply) throw;                     // Guard against underflow

    balances[msg.sender] -= _amount;
    totalSupply -= _amount;
    Burn(msg.sender, _amount);
    return true;
  }

  // CONTRACT MUTATORS

  // Lock the contract owner forever
  function lockContractOwner() notClosed onlyContractOwner noEther returns(bool success) {
    isContractOwnerLocked = true;
    LockContractOwner(msg.sender);
    return true;
  }

  function transferContractOwnership(address _newOwner) notClosed onlyContractOwner noEther returns (bool success) {
    if(isContractOwnerLocked) throw;

    contractOwner = _newOwner;
    TransferContractOwnership(msg.sender, _newOwner);
    return true;
  }

  // Block the contract from ever being upgraded, closed, or destroyed
  function lockOpen() notClosed onlyContractOwner noEther returns (bool success) {
    isLockedOpen = true;
    LockOpen(msg.sender);
    return true;
  }

  function upgrade(address _upgradedContract) notLockedOpen notClosed onlyContractOwner noEther returns (bool success) {
    upgradedContract = _upgradedContract;
    close();
    Upgrade(_upgradedContract);
    return true;
  }

  function close() notLockedOpen notClosed onlyContractOwner noEther returns (bool success) {
    isClosed = true;
    Close(msg.sender);
    return true;
  }

  function destroyContract() notLockedOpen onlyContractOwner noEther {
    selfdestruct(contractOwner);
  }

  // PRIVATE MUTATORS

  function _transfer(address _from, address _to, uint256 _amount) notClosed private returns (bool success) {
    if (_amount > balances[_from]) return false;

    if (balances[_to] + _amount < balances[_to]) throw;      // Guard against overflow
    if (balances[_from] - _amount > balances[_from]) throw;  // Guard against underflow

    balances[_to] += _amount;
    balances[_from] -= _amount;
    _indexAccount(_to);
    Transfer(_from, _to, _amount);
    return true;
  }

  function _indexAccount(address _account) notClosed private returns (bool success) {
    if (accountExists[_account]) return;
    accountExists[_account] = true;
    accounts.push(_account);
    return true;
  }

  function _indexProofId(string _proofId) notClosed private returns (bool success) {
    if (proofIdExists[_proofId]) return;
    proofIdExists[_proofId] = true;
    proofIds.push(_proofId);
    return true;
  }

  // throw on malformed calls
  function () {
    throw;
  }
}
