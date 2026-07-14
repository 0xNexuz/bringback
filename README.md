# BringBack

**Lend your stuff without chasing people.**

BringBack is one lending desk for the **stuff** and **money** that leave your hands. Physical items become QR-tagged loans backed by a refundable MON bond; personal money loans become funded onchain offers with a named borrower, due date, and permanent repayment receipt.

Built as a new solo project for the **BuildAnything Spark hackathon** on Monad.

## The problem

Small things are easy to lend and strangely hard to get back. The same is true of informal money loans: both people forget the amount or deadline, reminders become awkward, and “I’ll pay you tomorrow” becomes impossible to track clearly.

## The solution

BringBack has two deliberately distinct modes:

- **Stuff:** The lender names any physical item, chooses a MON bond, and gets a shareable QR code. The borrower locks the bond. A confirmed return refunds it immediately; an overdue lender can claim it.
- **Money:** The lender funds a zero-interest offer for one named wallet. Only that borrower can accept and receive the principal. The borrower can later repay the exact amount directly to the lender, even after the deadline. Unaccepted offers remain cancelable.

There is no admin withdrawal and no BringBack custody account. The contract holds only active return bonds and money offers that have not yet been accepted.

## Why this needs to be onchain

The onchain component is the product rather than a decorative record:

- the exact bond is enforced by the contract;
- neither party nor the interface can secretly change the terms of an active loan;
- a successful return sends the bond directly back to the borrower;
- every checkout, return, and overdue claim is independently inspectable;
- money cannot leave an offer until the named borrower accepts it, and repayments go directly to the original lender;
- the web client renders contract state instead of placeholder loan data.

BringBack is an accountability tool for people who already know one another. A blockchain cannot determine whether a physical item was actually returned, so the lender remains the return oracle. It is not positioned as trustless physical-goods arbitration.

## Contract state

An item moves through three deliberately small states:

```text
AVAILABLE ── borrow + exact bond ──▶ BORROWED
    ▲                                  │
    │                                  ├── lender confirms return ──▶ AVAILABLE
    │                                  │
    └──── can be borrowed again        └── overdue claim ──▶ RETIRED
```

Contract actions:

| Function | Who calls it | Result |
|---|---|---|
| `createItem` | Lender | Registers the name, bond, and loan duration |
| `borrowItem` | Borrower | Locks the exact native MON bond |
| `confirmReturn` | Lender | Refunds the borrower and makes the item reusable |
| `claimOverdueBond` | Lender | Pays the overdue bond to the lender and retires the item |
| `retireItem` | Lender | Retires an available item without moving funds |
| `createMoneyLoan` | Lender | Funds a cancelable offer for one borrower |
| `acceptMoneyLoan` | Named borrower | Receives the principal and starts the deadline |
| `repayMoneyLoan` | Borrower | Repays the exact principal directly to the lender |
| `cancelMoneyLoan` | Lender | Recovers an offer that has not been accepted |

## Current deployments

| Network | Chain ID | Contract |
|---|---:|---|
| Monad Testnet | 10143 | _Deploy and add address_ |
| Monad Mainnet | 143 | _Optional after testnet QA_ |

## Stack

- Solidity 0.8.28
- Hardhat and Chai
- React 18 and TypeScript
- Vite
- viem wallet/contract integration
- `qrcode.react`

## Local setup

Requirements: Node.js 20+ and a browser wallet such as MetaMask.

```bash
npm install
cp .env.example .env
npm run dev
```

The interface can be previewed before deployment. It clearly displays a builder notice until `VITE_CONTRACT_ADDRESS` is configured; it does not substitute fake item records.

### Verification commands

```bash
npm run contract:test
npm run typecheck
npm run build
```

The current suite covers:

- item creation and lender indexing;
- exact bond custody;
- self-borrow and incorrect-bond rejection;
- borrower refunds and item reuse;
- overdue timing and lender authorization;
- invalid input and item retirement.
- funded money offers, designated-borrower acceptance, exact repayment, and cancellation.

## Deploy to Monad Testnet

Use a disposable development wallet. Never use a wallet that holds meaningful funds and never commit a private key.

1. Add Monad Testnet and obtain test MON.
2. In the shell session used only for deployment, expose the private key as an environment variable.
3. Deploy the contract:

PowerShell:

```powershell
$env:DEPLOYER_PRIVATE_KEY="0xYOUR_DISPOSABLE_KEY"
npm run contract:deploy:testnet
Remove-Item Env:DEPLOYER_PRIVATE_KEY
```

4. Copy the emitted contract address into `.env`:

```dotenv
VITE_CONTRACT_ADDRESS=0xDEPLOYED_ADDRESS
VITE_CHAIN_ID=10143
VITE_RPC_URL=https://rpc.testnet.monad.xyz
```

5. Restart the development server and run a full two-wallet checkout/return test.
6. Add the contract address to the deployment table above.

To deploy to mainnet, first complete testnet QA, fund the disposable deployer with a minimal amount of real MON, change the client chain variables to `143` and `https://rpc.monad.xyz`, then run `npm run contract:deploy:mainnet`.

## Hosted deployment

The repository includes a Vercel SPA rewrite and a Netlify redirect so QR routes such as `/item/42` resolve to the React application on direct visits.

Set these variables in the host dashboard:

```dotenv
VITE_CONTRACT_ADDRESS=0xDEPLOYED_ADDRESS
VITE_CHAIN_ID=10143
VITE_RPC_URL=https://rpc.testnet.monad.xyz
```

Build command: `npm run build`  
Output directory: `dist`

## Three-minute demo

1. **0:00–0:15** — Hold up a real charger and explain the personal problem.
2. **0:15–0:45** — Connect the lender wallet and create its item tag.
3. **0:45–1:10** — Open the QR code and scan it using a second device.
4. **1:10–1:40** — Lock the bond with the borrower wallet.
5. **1:40–2:05** — Show the live borrower, deadline, and explorer transaction.
6. **2:05–2:35** — Return the charger and confirm the return as the lender.
7. **2:35–2:50** — Show the refunded borrower balance and reusable item.
8. **2:50–3:00** — “BringBack: lend your stuff without chasing people.”

Do not simulate the wallet interactions in the recording. Use two real development wallets and show both explorer links.

## Submission copy

**Name:** BringBack

**Description:** One onchain lending desk for the stuff and money friends need to bring back.

**Problem:** I lend chargers and other small items to friends, and I also cover meals, transport, and small expenses. We forget who has what, what is owed, and when it should come back. Following up becomes awkward.

**Solution:** BringBack separates physical and money loans into two honest onchain flows. Physical items get QR checkout tags and refundable return bonds. Money loans are funded offers that only the named borrower can accept, with a visible deadline and direct onchain repayment. One dashboard shows what I lent, what I borrowed, what I am owed, and what I owe.

## Security notes

- Checks-effects-interactions and a reentrancy guard protect every bond, principal, refund, and repayment transfer.
- Contract calls use custom errors and exact-value checks.
- There is no owner, upgrade mechanism, admin balance, or emergency withdrawal.
- Native MON transfers to contracts that reject funds will revert safely.
- The contract has hackathon-level tests but has not undergone a professional audit. Keep bond values small.

## License

MIT
