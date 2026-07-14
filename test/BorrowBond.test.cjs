const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BorrowBond", function () {
  async function deployFixture() {
    const [lender, borrower, stranger] = await ethers.getSigners();
    const BorrowBond = await ethers.getContractFactory("BorrowBond");
    const contract = await BorrowBond.deploy();
    const bond = ethers.parseEther("0.1");
    const duration = 3600;
    return { contract, lender, borrower, stranger, bond, duration };
  }

  async function createItem(fixture) {
    const { contract, lender, bond, duration } = fixture;
    await contract.connect(lender).createItem("USB-C charger", bond, duration);
    return 1n;
  }

  it("creates an available item and indexes it by lender", async function () {
    const fixture = await deployFixture();
    await expect(fixture.contract.connect(fixture.lender).createItem("USB-C charger", fixture.bond, fixture.duration))
      .to.emit(fixture.contract, "ItemCreated")
      .withArgs(1n, fixture.lender.address, "USB-C charger", fixture.bond, fixture.duration);

    const item = await fixture.contract.getItem(1n);
    expect(item.lender).to.equal(fixture.lender.address);
    expect(item.status).to.equal(0n);
    expect(await fixture.contract.getLenderItemIds(fixture.lender.address)).to.deep.equal([1n]);
  });

  it("locks the exact bond when another wallet borrows", async function () {
    const fixture = await deployFixture();
    const itemId = await createItem(fixture);

    await expect(fixture.contract.connect(fixture.borrower).borrowItem(itemId, { value: fixture.bond }))
      .to.emit(fixture.contract, "ItemBorrowed");

    const item = await fixture.contract.getItem(itemId);
    expect(item.borrower).to.equal(fixture.borrower.address);
    expect(item.status).to.equal(1n);
    expect(await ethers.provider.getBalance(await fixture.contract.getAddress())).to.equal(fixture.bond);
  });

  it("rejects self-borrowing and incorrect bonds", async function () {
    const fixture = await deployFixture();
    const itemId = await createItem(fixture);

    await expect(fixture.contract.connect(fixture.lender).borrowItem(itemId, { value: fixture.bond }))
      .to.be.revertedWithCustomError(fixture.contract, "CannotBorrowOwnItem");
    await expect(fixture.contract.connect(fixture.borrower).borrowItem(itemId, { value: fixture.bond - 1n }))
      .to.be.revertedWithCustomError(fixture.contract, "IncorrectBond");
  });

  it("refunds the borrower and makes a returned item reusable", async function () {
    const fixture = await deployFixture();
    const itemId = await createItem(fixture);
    await fixture.contract.connect(fixture.borrower).borrowItem(itemId, { value: fixture.bond });

    await expect(() => fixture.contract.connect(fixture.lender).confirmReturn(itemId))
      .to.changeEtherBalances([fixture.contract, fixture.borrower], [-fixture.bond, fixture.bond]);

    const item = await fixture.contract.getItem(itemId);
    expect(item.status).to.equal(0n);
    expect(item.borrower).to.equal(ethers.ZeroAddress);
    expect(item.completedLoans).to.equal(1n);
  });

  it("lets only the lender claim a genuinely overdue bond", async function () {
    const fixture = await deployFixture();
    const itemId = await createItem(fixture);
    await fixture.contract.connect(fixture.borrower).borrowItem(itemId, { value: fixture.bond });

    await expect(fixture.contract.connect(fixture.lender).claimOverdueBond(itemId))
      .to.be.revertedWithCustomError(fixture.contract, "NotOverdue");
    await time.increase(fixture.duration + 1);
    await expect(fixture.contract.connect(fixture.stranger).claimOverdueBond(itemId))
      .to.be.revertedWithCustomError(fixture.contract, "NotLender");
    await expect(() => fixture.contract.connect(fixture.lender).claimOverdueBond(itemId))
      .to.changeEtherBalances([fixture.contract, fixture.lender], [-fixture.bond, fixture.bond]);

    expect((await fixture.contract.getItem(itemId)).status).to.equal(2n);
  });

  it("validates names, bonds, durations, and retirement", async function () {
    const fixture = await deployFixture();
    await expect(fixture.contract.createItem("", fixture.bond, fixture.duration))
      .to.be.revertedWithCustomError(fixture.contract, "InvalidName");
    await expect(fixture.contract.createItem("Item", 0, fixture.duration))
      .to.be.revertedWithCustomError(fixture.contract, "InvalidBond");
    await expect(fixture.contract.createItem("Item", fixture.bond, 59))
      .to.be.revertedWithCustomError(fixture.contract, "InvalidDuration");

    const itemId = await createItem(fixture);
    await fixture.contract.connect(fixture.lender).retireItem(itemId);
    expect((await fixture.contract.getItem(itemId)).status).to.equal(2n);
    await expect(fixture.contract.connect(fixture.borrower).borrowItem(itemId, { value: fixture.bond }))
      .to.be.revertedWithCustomError(fixture.contract, "ItemUnavailable");
  });

  it("escrows a money-loan offer until the named borrower accepts", async function () {
    const fixture = await deployFixture();
    const amount = ethers.parseEther("0.25");

    await expect(
      fixture.contract
        .connect(fixture.lender)
        .createMoneyLoan(fixture.borrower.address, "Lunch and transport", fixture.duration, { value: amount }),
    ).to.emit(fixture.contract, "MoneyLoanOffered");

    expect(await ethers.provider.getBalance(await fixture.contract.getAddress())).to.equal(amount);
    await expect(fixture.contract.connect(fixture.stranger).acceptMoneyLoan(1n))
      .to.be.revertedWithCustomError(fixture.contract, "NotBorrower");
    await expect(() => fixture.contract.connect(fixture.borrower).acceptMoneyLoan(1n))
      .to.changeEtherBalances([fixture.contract, fixture.borrower], [-amount, amount]);

    const loan = await fixture.contract.getMoneyLoan(1n);
    expect(loan.status).to.equal(1n);
    expect(loan.dueAt).to.be.greaterThan(0n);
  });

  it("returns an exact money repayment directly to the lender", async function () {
    const fixture = await deployFixture();
    const amount = ethers.parseEther("0.25");
    await fixture.contract
      .connect(fixture.lender)
      .createMoneyLoan(fixture.borrower.address, "Lunch and transport", fixture.duration, { value: amount });
    await fixture.contract.connect(fixture.borrower).acceptMoneyLoan(1n);

    await expect(fixture.contract.connect(fixture.borrower).repayMoneyLoan(1n, { value: amount - 1n }))
      .to.be.revertedWithCustomError(fixture.contract, "IncorrectRepayment");
    await expect(() => fixture.contract.connect(fixture.borrower).repayMoneyLoan(1n, { value: amount }))
      .to.changeEtherBalances([fixture.borrower, fixture.lender], [-amount, amount]);
    expect((await fixture.contract.getMoneyLoan(1n)).status).to.equal(2n);
  });

  it("lets the lender cancel only an unaccepted money-loan offer", async function () {
    const fixture = await deployFixture();
    const amount = ethers.parseEther("0.25");
    await fixture.contract
      .connect(fixture.lender)
      .createMoneyLoan(fixture.borrower.address, "Lunch and transport", fixture.duration, { value: amount });

    await expect(fixture.contract.connect(fixture.borrower).cancelMoneyLoan(1n))
      .to.be.revertedWithCustomError(fixture.contract, "NotLender");
    await expect(() => fixture.contract.connect(fixture.lender).cancelMoneyLoan(1n))
      .to.changeEtherBalances([fixture.contract, fixture.lender], [-amount, amount]);
    expect((await fixture.contract.getMoneyLoan(1n)).status).to.equal(3n);
  });
});
