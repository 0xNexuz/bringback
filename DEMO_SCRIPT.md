# BringBack demo script

Target runtime: **2 minutes 50 seconds**  
Hard limit: **under 3 minutes**

This script demonstrates real Stuff and Money transactions. Do not replace wallet confirmations or results with edited success screens.

## Before recording

- Deploy `BorrowBond` on Monad Testnet and configure the hosted app with its address.
- Prepare two disposable wallets:
  - **Wallet A:** lender
  - **Wallet B:** borrower
- Fund both wallets with enough testnet MON for gas. Wallet A also needs the money-loan principal.
- Open the hosted application in two browser profiles or two devices.
- Connect Wallet A in the first window and Wallet B in the second.
- Keep the Monad explorer open in another tab.
- Use a real charger as the physical prop.
- Close unrelated tabs, hide personal wallet activity, and disable notifications.
- Record at 1080p with the browser zoomed so addresses, amounts, and statuses remain readable.

## Recording script

### 0:00-0:15 - Personal hook

**On screen:** Hold up the charger, then place it beside the laptop.

**Say:**

> This is the charger my friends keep borrowing. The same thing happens when I cover lunch or transport: I forget who has what, how much they owe, and when it should come back.

### 0:15-0:28 - Product promise

**On screen:** Show the BringBack hero and scroll just enough to reveal the lending desk.

**Say:**

> BringBack is one onchain lending desk for physical stuff and personal money loans. It makes the agreement visible and lets the contract handle the money.

### 0:28-1:18 - Stuff flow

**On screen:** Wallet A, Stuff mode.

1. Click **Tag an item**.
2. Enter `65W USB-C charger`.
3. Set the return bond to `0.1 MON`.
4. Choose a one-day window and confirm the transaction.
5. Open the generated QR code.

**Say while performing the actions:**

> In Stuff mode, I name the item, choose a small refundable bond, and set the return window. BringBack creates a QR tag anyone can scan.

**On screen:** Switch to Wallet B, scan or open the borrow link, and lock the bond.

**Say:**

> My friend scans it and locks the exact bond. The contract now records who has the charger and when it is due.

**On screen:** Return to Wallet A, show the active loan, click **Confirm return**, and show the item becoming available again.

**Say:**

> When I get it back, one confirmation refunds the borrower directly and makes the tag reusable.

### 1:18-2:20 - Money flow

**On screen:** Wallet A, switch to Money mode.

1. Click **Lend money**.
2. Paste Wallet B's public address.
3. Enter `Lunch and transport`.
4. Set the principal to `0.2 MON` and the window to one day.
5. Fund the offer.

**Say:**

> Money mode is a separate flow. I fund a zero-interest offer for one specific wallet, with a clear amount, purpose, and repayment window.

**On screen:** Switch to Wallet B, open **Money I owe**, accept the offer, and show the received principal.

**Say:**

> Only the named borrower can accept and receive these funds. Acceptance starts the deadline.

**On screen:** From Wallet B, click **Pay back 0.2 MON** and confirm. Switch to Wallet A and show **Paid back**.

**Say:**

> Repayment must match the original principal and goes directly back to the lender. The completed loan remains as an onchain receipt.

### 2:20-2:38 - Proof that it is live

**On screen:** Open one item transaction and one money repayment on the Monad explorer. Briefly show the public GitHub repository.

**Say:**

> These are live Monad Testnet transactions, not placeholder toasts. The contract, tests, deployment code, and interface are all public.

### 2:38-2:50 - Close

**On screen:** Return to the hero, with the physical charger still visible.

**Say:**

> BringBack: what you lend should come back - whether it is your charger or your money.

## Editing notes

- Keep wallet popups visible, but cut only genuine waiting time between confirmations.
- Never expose seed phrases, private keys, balances from unrelated accounts, or browser autofill.
- Use short labels for Wallet A and Wallet B so viewers can follow the role changes.
- Add captions for every spoken line.
- Keep background music low enough that transaction sounds and narration remain clear.
- End on the product name, hosted URL, GitHub URL, and verified contract address.
