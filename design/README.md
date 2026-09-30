# Millstone design handoff

Exported from Claude Design (29 Sep 2026). These HTML files are **visual reference only**: match layout, copy, spacing and states, but build real React components in `src/`. Do not import or copy `ds/.../bundle.js`. Font/image URLs starting `/_blob/` will not load here; fonts are in `system/fonts/`.

- `system/` — tokens (`tokens.css`, `tokens.json`), component specs (`components/*/README.md`, `components/index.d.ts` for props), design-system README, font files.
- `customer/` — mobile screens, 390px wide.
- `admin/` — tablet screens, 1180px wide, `data-context="admin"`.

## Customer screens

| File | What it shows |
|---|---|
| `customer/Main.dc.html` | Play the flow here: C1 Home → C2 → C4 → C5 → C6 → C7, with C8 sign-in and C9–C12 My account |
| `customer/Home.dc.html` | C1 · First visit — no branch chosen yet (AC-C1) |
| `customer/HomeSelected.dc.html` | C1 · Branch chosen |
| `customer/HomeReturn.dc.html` | C1 · Back from the menu with items in the order (AC-C2) |
| `customer/Menu.dc.html` | C2 · Menu — interactive (Northcote, Wed 30 Sep, 2 items) |
| `customer/FirstVisit.dc.html` | C2 · First visit — earliest day chosen, order empty |
| `customer/DateChanged.dc.html` | C2 · Day changed — sold-out item taken out (AC-C3) |
| `customer/AfterCutoff.dc.html` | C2 · After 2pm — earliest pickup Thu 1 Oct (AC-C3) |
| `customer/FullPage.dc.html` | C2 · Whole page, scroll length |
| `customer/MenuBranchChanged.dc.html` | C2 · After switching to Fitzroy — removed item named (AC-C2) |
| `customer/Cart.dc.html` | C4 · Cart — edit quantities, branch and day |
| `customer/CartBranchSheet.dc.html` | C4 · Change branch (AC-C2) |
| `customer/CartBranchWarning.dc.html` | C4 · Warning lists items the new branch doesn’t make (AC-C2) |
| `customer/CartBranchChanged.dc.html` | C4 · After switching — removed item named (AC-C2) |
| `customer/CartEmpty.dc.html` | C4 · Empty order |
| `customer/Checkout.dc.html` | C5 · Guest checkout — blank (AC-C4, C5) |
| `customer/CheckoutErrors.dc.html` | C5 · Guest — fields to fix, no payment chosen (AC-C4, C5) |
| `customer/CheckoutGuestOnline.dc.html` | C5 · Guest — pay online chosen |
| `customer/CheckoutSignedIn.dc.html` | C5 · Signed in — details prefilled, pay at pickup (AC-C4) |
| `customer/CheckoutPayFailed.dc.html` | C5 · Back from payment — failed or cancelled, cart intact (AC-C6) |
| `customer/PayStandIn.dc.html` | Stand-in for the payment provider (not designed) |
| `customer/Confirming.dc.html` | C6 · Confirming payment (AC-C6) |
| `customer/ConfirmingSlow.dc.html` | C6 · Webhook slow to arrive |
| `customer/Confirmation.dc.html` | C7 · Guest, paid online — create-account offer (AC-C9, C10) |
| `customer/ConfGuestPickup.dc.html` | C7 · Guest, pay at pickup (AC-C7, C9) |
| `customer/ConfAccountCreated.dc.html` | C7 · Guest after creating an account (AC-C10) |
| `customer/ConfSignedIn.dc.html` | C7 · Signed in — no account offer |
| `customer/Account.dc.html` | C8 · Sign in — from checkout |
| `customer/SignInError.dc.html` | C8 · Sign in — details don’t match |
| `customer/SignUp.dc.html` | C8 · Create an account |
| `customer/SignUpErrors.dc.html` | C8 · Create an account — fields to fix |
| `customer/ResetRequest.dc.html` | C8 · Reset password |
| `customer/ResetSent.dc.html` | C8 · Check your email |
| `customer/NewPassword.dc.html` | C8 · Set a new password (from the email link) |
| `customer/ResetExpired.dc.html` | C8 · Reset link expired |
| `customer/AccountArea.dc.html` | C9 · My account — generated order with its note (AC-R10) |
| `customer/MyAccountNew.dc.html` | C9 · New account — empty order history |
| `customer/RecList.dc.html` | C10 · My recurring orders — active and paused (AC-R3) |
| `customer/RecListEnded.dc.html` | C10 · One recurring order ended (AC-R7) |
| `customer/RecGuest.dc.html` | AC-R1 · Guest taps “Set up a recurring order” on C1 → sign in first |
| `customer/RecFormNew.dc.html` | C11 · New recurring order (AC-R2) |
| `customer/RecFormErrors.dc.html` | C11 · Nothing chosen yet — fields to fix (AC-R2) |
| `customer/RecFormEdit.dc.html` | C11 · Editing — branch locked (AC-R4) |
| `customer/RecDetail.dc.html` | C12 · Detail — made order, a skipped day with Undo (AC-R5) |
| `customer/RecDetailPaused.dc.html` | C12 · Paused — Resume (AC-R6) |
| `customer/RecDetailEnd.dc.html` | C12 · Ending — stop now or after a pickup day (AC-R7) |
| `customer/RecDetailEnded.dc.html` | C12 · Ended |
| `customer/Email.dc.html` | C13 · Email — guest, paid online (AC-C9) |
| `customer/EmailPickup.dc.html` | C13 · Email — signed in, pay at pickup (AC-C9) |
| `customer/EmailWide.dc.html` | C13 · Email — paid, in a 600px desktop client |

## Admin screens

| File | What it shows |
|---|---|
| `admin/Main.dc.html` | A2 · Staff, Northcote — default list (interactive; Details opens A3) |
| `admin/Owner.dc.html` | A2 · Owner — all branches |
| `admin/Search.dc.html` | A2 · Search by phone (all dates and statuses) |
| `admin/ConfirmPayment.dc.html` | A2 · Collecting an unpaid order — confirm payment |
| `admin/Empty.dc.html` | A2 · Empty — no orders for the chosen date |
| `admin/Undo.dc.html` | A2 · Paid order collected — Undo message (shows ~5 s) |
| `admin/DetailOpen.dc.html` | A3 · Placed order detail — recurring, generation note, notes |
| `admin/CancelDialog.dc.html` | A3 · Cancel with reason — paid online, refund reminder |
| `admin/RefundDue.dc.html` | A3 · Cancelled, paid online — Mark refunded |
| `admin/ReadOnly.dc.html` | A3 · Collected — read-only |
| `admin/Availability.dc.html` | A4 · Branch availability — staff, Northcote (interactive) |
| `admin/AvailabilityOwner.dc.html` | A4 · Branch availability — owner, any branch |
| `admin/Products.dc.html` | A5 · Products, owner only (interactive) |
| `admin/ProductEdit.dc.html` | A5 · Edit — price change note (AC-P3) |
| `admin/ProductHide.dc.html` | A5 · Edit — hiding a product (AC-P2) |
| `admin/ProductNew.dc.html` | A5 · New product with a new category (AC-P1) |
