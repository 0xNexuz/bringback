# BringBack

**Lend your stuff without chasing people.**

BringBack turns chargers, books, power banks, controllers, and other everyday items into QR-tagged loans backed by a small, refundable MON bond.

Built as a new solo project for the **BuildAnything Spark hackathon** on Monad.

## The problem

Small things are easy to lend and strangely hard to get back. Both people forget who has what, reminders become awkward, and inexpensive-but-essential items quietly disappear.

## The solution

1. The lender names an item, chooses a MON bond, and sets a return window.
2. BringBack creates a shareable QR code for that item.
3. The borrower scans it and locks the exact bond in `BorrowBond.sol`.
4. When the item comes back, the lender confirms the return.
5. The contract refunds the borrower's wallet immediately.
6. If the deadline passes, the lender can claim the bond and the item is retired.

There is no admin withdrawal and no BringBack custody account. The contract holds only active return bonds.

## Why this needs to be onchain

The onchain component is the product rather than a decorative record:

- the exact bond is enforced by the contract;
- neither party nor the interface can secretly change the terms of an active loan;
- a successful return sends the bond directly back to the borrower;
- every checkout, return, and overdue claim is independently inspectable;
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

**Description:** QR-tagged loans with refundable onchain return bonds.

**Problem:** I lend chargers, power banks, books, and other small items to friends. We both forget who has what, and I end up repeatedly asking for my things back.

**Solution:** BringBack creates a QR checkout tag for anything I lend. The borrower locks a small MON bond in a Monad smart contract. When the item is returned, the contract immediately refunds the bond. If it remains overdue, the lender can claim the bond. This creates a lightweight incentive to return borrowed items without subscriptions, paperwork, or an intermediary.

## Security notes

- Checks-effects-interactions and a reentrancy guard protect bond payouts.
- Contract calls use custom errors and exact-value checks.
- There is no owner, upgrade mechanism, admin balance, or emergency withdrawal.
- Native MON transfers to contracts that reject funds will revert safely.
- The contract has hackathon-level tests but has not undergone a professional audit. Keep bond values small.

## License

MIT
