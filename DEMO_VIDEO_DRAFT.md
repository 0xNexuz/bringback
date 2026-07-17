# BringBack demo video draft

Format: 16:9, 1080p, captioned

Target length: **2 minutes 45 seconds**
Maximum allowed length: **under 3 minutes**

This is the edit/storyboard draft for the public demo video.

## Story arc

### 0:00-0:12 - The hook

**Visual:** Creator holds up a real charger. Fast cut to a chat-style card reading “I’ll return it tomorrow,” then a second card reading “I’ll pay you back tomorrow.”

**Narration:**

> My friends borrow chargers. I cover lunch. Then everybody forgets.

**On-screen text:** `WHAT YOU LEND SHOULD COME BACK.`

### 0:12-0:25 - Introduce BringBack

**Visual:** Hero section, then a smooth scroll into the Stuff/Money selector.

**Narration:**

> BringBack is one onchain lending desk for physical stuff and personal money loans.

**On-screen labels:** `STUFF` and `MONEY`

### 0:25-1:10 - Stuff demo

**Visual sequence:**

1. Wallet A creates `65W USB-C charger` with a `0.1 MON` bond.
2. The QR tag appears.
3. Wallet B opens the link and locks the bond.
4. Wallet A sees the live borrower and deadline.
5. Wallet A confirms the return.
6. The item becomes available and Wallet B receives the refund.

**Narration:**

> For stuff, I name the item, choose a small return bond, and share its QR. My friend locks the exact bond, so we both know who has the item and when it is due. When it comes back, one confirmation refunds them directly.

**Impact overlay:** `ITEM RETURNED • BOND REFUNDED`

### 1:10-2:05 - Money demo

**Visual sequence:**

1. Wallet A switches to Money mode.
2. Create `Lunch and transport`, `0.2 MON`, for Wallet B.
3. Wallet B accepts and receives the principal.
4. Show the deadline and `Money I owe` view.
5. Wallet B repays `0.2 MON`.
6. Wallet A sees `Paid back`.

**Narration:**

> Money is a separate flow. I fund an offer for one specific wallet with a clear amount and deadline. Only that borrower can accept it. When they repay, the exact principal returns to me and the completed loan remains as an onchain receipt.

**Impact overlay:** `0.2 MON • PAID BACK`

### 2:05-2:25 - Prove it is real

**Visual:** Split screen showing the Monad explorer transaction, public contract, and GitHub test output.

**Narration:**

> These are live Monad Testnet transactions. The contract handles custody and settlement, and all nine tests and the complete source are public.

**On-screen text:** `LIVE CONTRACT • 9 TESTS • PUBLIC SOURCE`

### 2:25-2:45 - Close and CTA

**Visual:** Return to the hero. The physical charger is placed beside the laptop. End card contains the app URL, GitHub repository, and Monad contract address.

**Narration:**

> BringBack. What you lend should come back - whether it is your charger or your money.

**End card:**

```text
BRINGBACK
https://bringback-ebon.vercel.app
github.com/0xNexuz/bringback
0xC8c563F8e2fe16ce84669e2f4BDBC186f1eB1c5c
```

## Editing direction

- Keep real wallet confirmations visible.
- Cut transaction waiting time, but do not fake transaction results.
- Use the existing cream, ink, neon-lime, and coral interface colors for titles.
- Keep captions inside mobile-safe margins.
- Use address labels `LENDER` and `BORROWER` whenever the wallet changes.
- Zoom into bond, deadline, borrower, and repayment statuses.
- Keep background music subtle and narration dominant.
- Never show a seed phrase, private key, unrelated balance, browser autofill, or personal notification.

## Required capture checklist

- Hero and Stuff/Money selector
- Item creation form
- Generated QR tag
- Borrower locking the bond
- Lender confirming the physical return
- Refund transaction
- Money offer form
- Borrower accepting the principal
- Borrower repayment
- Paid-back status
- Monad explorer transactions
- GitHub repository and passing test output
- Final URL and verified contract address
