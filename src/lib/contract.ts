import { isAddress, type Abi, type Address } from "viem";

const configuredAddress = String(import.meta.env.VITE_CONTRACT_ADDRESS || "").trim();

export const contractAddress: Address | undefined = isAddress(configuredAddress)
  ? (configuredAddress as Address)
  : undefined;

const itemComponents = [
  { name: "id", type: "uint256" },
  { name: "lender", type: "address" },
  { name: "borrower", type: "address" },
  { name: "name", type: "string" },
  { name: "bondAmount", type: "uint256" },
  { name: "loanDuration", type: "uint64" },
  { name: "dueAt", type: "uint64" },
  { name: "completedLoans", type: "uint32" },
  { name: "status", type: "uint8" },
] as const;

const moneyLoanComponents = [
  { name: "id", type: "uint256" },
  { name: "lender", type: "address" },
  { name: "borrower", type: "address" },
  { name: "memo", type: "string" },
  { name: "amount", type: "uint256" },
  { name: "loanDuration", type: "uint64" },
  { name: "dueAt", type: "uint64" },
  { name: "status", type: "uint8" },
] as const;

export const borrowBondAbi = [
  { type: "error", name: "InvalidBorrower", inputs: [] },
  { type: "error", name: "InvalidDuration", inputs: [] },
  { type: "error", name: "InvalidBond", inputs: [] },
  { type: "error", name: "NotLender", inputs: [] },
  { type: "error", name: "NotBorrower", inputs: [] },
  { type: "error", name: "LoanUnavailable", inputs: [] },
  { type: "error", name: "IncorrectRepayment", inputs: [] },
  { type: "error", name: "TransferFailed", inputs: [] },
  {
    type: "function",
    name: "createItem",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "bondAmount", type: "uint256" },
      { name: "loanDuration", type: "uint64" },
    ],
    outputs: [{ name: "itemId", type: "uint256" }],
  },
  {
    type: "function",
    name: "borrowItem",
    stateMutability: "payable",
    inputs: [{ name: "itemId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "confirmReturn",
    stateMutability: "nonpayable",
    inputs: [{ name: "itemId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "claimOverdueBond",
    stateMutability: "nonpayable",
    inputs: [{ name: "itemId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "retireItem",
    stateMutability: "nonpayable",
    inputs: [{ name: "itemId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getItem",
    stateMutability: "view",
    inputs: [{ name: "itemId", type: "uint256" }],
    outputs: [{ name: "item", type: "tuple", components: itemComponents }],
  },
  {
    type: "function",
    name: "getLenderItemIds",
    stateMutability: "view",
    inputs: [{ name: "lender", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "getBorrowerItemIds",
    stateMutability: "view",
    inputs: [{ name: "borrower", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "createMoneyLoan",
    stateMutability: "payable",
    inputs: [
      { name: "borrower", type: "address" },
      { name: "memo", type: "string" },
      { name: "loanDuration", type: "uint64" },
    ],
    outputs: [{ name: "loanId", type: "uint256" }],
  },
  {
    type: "function",
    name: "acceptMoneyLoan",
    stateMutability: "nonpayable",
    inputs: [{ name: "loanId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "repayMoneyLoan",
    stateMutability: "payable",
    inputs: [{ name: "loanId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "cancelMoneyLoan",
    stateMutability: "nonpayable",
    inputs: [{ name: "loanId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getMoneyLoan",
    stateMutability: "view",
    inputs: [{ name: "loanId", type: "uint256" }],
    outputs: [{ name: "loan", type: "tuple", components: moneyLoanComponents }],
  },
  {
    type: "function",
    name: "getLenderMoneyLoanIds",
    stateMutability: "view",
    inputs: [{ name: "lender", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "getBorrowerMoneyLoanIds",
    stateMutability: "view",
    inputs: [{ name: "borrower", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
] as const satisfies Abi;

export type ItemStatus = 0 | 1 | 2;

export interface ContractItem {
  id: bigint;
  lender: Address;
  borrower: Address;
  name: string;
  bondAmount: bigint;
  loanDuration: bigint;
  dueAt: bigint;
  completedLoans: number;
  status: ItemStatus;
}

export type MoneyLoanStatus = 0 | 1 | 2 | 3;

export interface ContractMoneyLoan {
  id: bigint;
  lender: Address;
  borrower: Address;
  memo: string;
  amount: bigint;
  loanDuration: bigint;
  dueAt: bigint;
  status: MoneyLoanStatus;
}
