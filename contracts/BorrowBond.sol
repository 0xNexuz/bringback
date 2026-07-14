// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title BorrowBond
/// @notice Refundable MON bonds for physical items lent between people who know each other.
/// @dev This contract provides accountability, not arbitration for physical-world disputes.
contract BorrowBond {
    enum ItemStatus {
        Available,
        Borrowed,
        Retired
    }

    struct Item {
        uint256 id;
        address lender;
        address borrower;
        string name;
        uint256 bondAmount;
        uint64 loanDuration;
        uint64 dueAt;
        uint32 completedLoans;
        ItemStatus status;
    }

    uint64 public constant MIN_LOAN_DURATION = 60;
    uint64 public constant MAX_LOAN_DURATION = 30 days;

    uint256 public itemCount;
    mapping(uint256 => Item) private items;
    mapping(address => uint256[]) private lenderItemIds;
    mapping(address => uint256[]) private borrowerItemIds;

    uint256 private locked = 1;

    error ItemNotFound();
    error NotLender();
    error InvalidName();
    error InvalidBond();
    error InvalidDuration();
    error ItemUnavailable();
    error CannotBorrowOwnItem();
    error IncorrectBond();
    error NotBorrowed();
    error NotOverdue();
    error TransferFailed();
    error ReentrantCall();

    event ItemCreated(
        uint256 indexed itemId,
        address indexed lender,
        string name,
        uint256 bondAmount,
        uint64 loanDuration
    );
    event ItemBorrowed(
        uint256 indexed itemId,
        address indexed lender,
        address indexed borrower,
        uint256 bondAmount,
        uint64 dueAt
    );
    event ItemReturned(
        uint256 indexed itemId,
        address indexed lender,
        address indexed borrower,
        uint256 refundedBond
    );
    event BondClaimed(
        uint256 indexed itemId,
        address indexed lender,
        address indexed borrower,
        uint256 bondAmount
    );
    event ItemRetired(uint256 indexed itemId, address indexed lender);

    modifier nonReentrant() {
        if (locked != 1) revert ReentrantCall();
        locked = 2;
        _;
        locked = 1;
    }

    modifier existingItem(uint256 itemId) {
        if (itemId == 0 || itemId > itemCount) revert ItemNotFound();
        _;
    }

    function createItem(
        string calldata name,
        uint256 bondAmount,
        uint64 loanDuration
    ) external returns (uint256 itemId) {
        uint256 nameLength = bytes(name).length;
        if (nameLength == 0 || nameLength > 64) revert InvalidName();
        if (bondAmount == 0) revert InvalidBond();
        if (loanDuration < MIN_LOAN_DURATION || loanDuration > MAX_LOAN_DURATION) {
            revert InvalidDuration();
        }

        itemId = ++itemCount;
        items[itemId] = Item({
            id: itemId,
            lender: msg.sender,
            borrower: address(0),
            name: name,
            bondAmount: bondAmount,
            loanDuration: loanDuration,
            dueAt: 0,
            completedLoans: 0,
            status: ItemStatus.Available
        });
        lenderItemIds[msg.sender].push(itemId);

        emit ItemCreated(itemId, msg.sender, name, bondAmount, loanDuration);
    }

    function borrowItem(uint256 itemId) external payable existingItem(itemId) {
        Item storage item = items[itemId];
        if (item.status != ItemStatus.Available) revert ItemUnavailable();
        if (msg.sender == item.lender) revert CannotBorrowOwnItem();
        if (msg.value != item.bondAmount) revert IncorrectBond();

        uint64 dueAt = uint64(block.timestamp) + item.loanDuration;
        item.borrower = msg.sender;
        item.dueAt = dueAt;
        item.status = ItemStatus.Borrowed;
        borrowerItemIds[msg.sender].push(itemId);

        emit ItemBorrowed(itemId, item.lender, msg.sender, msg.value, dueAt);
    }

    function confirmReturn(uint256 itemId) external nonReentrant existingItem(itemId) {
        Item storage item = items[itemId];
        if (msg.sender != item.lender) revert NotLender();
        if (item.status != ItemStatus.Borrowed) revert NotBorrowed();

        address borrower = item.borrower;
        uint256 refund = item.bondAmount;

        item.borrower = address(0);
        item.dueAt = 0;
        item.completedLoans += 1;
        item.status = ItemStatus.Available;

        (bool success, ) = borrower.call{value: refund}("");
        if (!success) revert TransferFailed();

        emit ItemReturned(itemId, msg.sender, borrower, refund);
    }

    function claimOverdueBond(uint256 itemId) external nonReentrant existingItem(itemId) {
        Item storage item = items[itemId];
        if (msg.sender != item.lender) revert NotLender();
        if (item.status != ItemStatus.Borrowed) revert NotBorrowed();
        if (block.timestamp <= item.dueAt) revert NotOverdue();

        address borrower = item.borrower;
        uint256 bond = item.bondAmount;
        item.status = ItemStatus.Retired;

        (bool success, ) = msg.sender.call{value: bond}("");
        if (!success) revert TransferFailed();

        emit BondClaimed(itemId, msg.sender, borrower, bond);
    }

    function retireItem(uint256 itemId) external existingItem(itemId) {
        Item storage item = items[itemId];
        if (msg.sender != item.lender) revert NotLender();
        if (item.status != ItemStatus.Available) revert ItemUnavailable();
        item.status = ItemStatus.Retired;
        emit ItemRetired(itemId, msg.sender);
    }

    function getItem(uint256 itemId) external view existingItem(itemId) returns (Item memory) {
        return items[itemId];
    }

    function getLenderItemIds(address lender) external view returns (uint256[] memory) {
        return lenderItemIds[lender];
    }

    function getBorrowerItemIds(address borrower) external view returns (uint256[] memory) {
        return borrowerItemIds[borrower];
    }
}
