# Millstone — Project Spec & Decisions

Original bakery ordering website. Inspired by a real bakery (the owner's workplace) but uses no real name or branding.

**Purpose:** portfolio piece + a real pitch to the bakery owners.

_Last updated: 29 Sep 2026 — design phase complete_

---

## 1. Pitch

- Keep it simple and non-technical — the owners are ~50–60 and not tech-savvy.
- Framing: **"catch the ~half of calls you're currently missing"**, not "a new complex system".
- Online payment is presented as an added convenience; pay at pickup keeps the current phone-order habit intact.

## 2. Stack

- Next.js / React + Bun (same as Tulips and Nook).
- Process: write specs (data model, status flow, acceptance criteria) before any code.

## 2a. Project Workflow

1. **Spec (this document):** features, decisions, data model, acceptance criteria.
2. **Claude Design:** create the UI from this spec.
3. **Claude Code:** build features step by step, one branch per feature, using prompts prepared in a separate Claude conversation.
4. **Claude in Chrome:** QA each developed feature against its acceptance criteria.

**Status:** steps 1 and 2 are complete. Every screen in section 11 is designed.

**Design links:**
- Customer screens canvas: https://claude.ai/artifact/W1zWg2eNTY7wjuXCS2p5wk
- Admin screens canvas: https://claude.ai/artifact/WoijnAGpy11XfYVKNdX9NW
- Millstone design system: https://claude.ai/artifact/SUaNipiVWuourAKr63PwpM

## 3. Scope

### In MVP
- 3 independent branches; customers order from the branch closest to them.
- Standard product ordering (bagels, bread, pastries, etc.).
- Guest checkout + optional accounts.
- Payment: customer chooses **pay online** or **pay at pickup** per order.
- Basic recurring orders for cafes/restaurants (set items + repeat days + branch).
- Simple admin: order list that staff check off.
- Notification setting stubbed in, **off by default**.

### Deferred (not in MVP)
- Custom catering / platter orders.
- Active admin notifications (setting exists, just switched off).
- Customer self-cancellation online.
- Refunds from inside the admin (done in provider dashboard for now).
- Automatic online charging for recurring orders.
- Weekly / monthly invoicing.
- Daily quantity limits per product.

### Assumptions (not yet confirmed)
- Pickup only, no delivery.
- Pickup is chosen by **date**, not time slot ("Come in any time that day").
- All branches are **closed on Mondays** (used across the designs; stored per branch so it can differ).
- All branches have a **2pm** order cutoff.

---

## 4. Branches & Catalog

**Decision:** one shared catalog + per-branch availability (not separate catalogs per branch).

- Prices are the **same across all branches** → price lives on `Product` only.
- Branch-only items = products available at only one branch.
- No real inventory counts: bakery items are baked daily, so availability is on/off plus "sold out for a date".
- `sold_out_on` is a date, not a boolean — staff mark a product sold out for a specific pickup date (defaulting to the earliest orderable date). It stops applying once that date passes, no cleanup job needed.
- New products are available at all branches by default; each branch can switch them off.
- A product is on a branch's menu when `Product.is_active` AND `BranchProduct.is_available`.
- A product is orderable for a date unless `sold_out_on` equals that date.

### Branch details (fictional)

| Branch | Address | Phone |
|---|---|---|
| Northcote | 214 High Street, Northcote | 03 7010 2140 |
| Fitzroy | 87 Gertrude Street, Fitzroy | 03 7010 0870 |
| Brunswick | 402 Sydney Road, Brunswick | 03 7010 4020 |

### Sample / seed data rule
- All sample phone numbers must be ACMA fictional numbers: mobiles from the 0491 570 range (e.g. 0491 570 006), landlines from (03) 7010 xxxx or (03) 5550 xxxx.
- Emails use example.com. Never use real names, numbers or addresses of the real bakery.

---

## 5. Data Model

```
Product             id, name, description, category, price, image, is_active

Branch              id, name, address, phone, order_cutoff_time,
                    opens_at (time, default 07:00),
                    closed_days (array of weekday numbers, 0 = Sunday),
                    notifications_enabled (default false)

BranchProduct       branch_id, product_id, is_available,
                    sold_out_on (date, nullable)

Customer            id, name, email (unique), phone,
                    password_hash (nullable), created_at

Order               id, order_number, branch_id, customer_id (nullable),
                    contact_name, contact_phone, contact_email,
                    pickup_date, status, notes,
                    payment_method (online | at_pickup),
                    payment_status (unpaid | paid | refunded),
                    payment_ref (nullable), paid_at (nullable),
                    refunded_at (nullable),
                    recurring_order_id (nullable), generation_note (nullable),
                    cancellation_reason (nullable),
                    total, created_at, ready_at, collected_at, cancelled_at

OrderItem           id, order_id, product_id,
                    product_name, unit_price, quantity, line_total

StaffUser           id, name, email (unique), password_hash,
                    role (owner | staff), branch_id (nullable for owner)

RecurringOrder      id, customer_id (required), branch_id,
                    days_of_week, status (active | paused),
                    starts_on, ends_on (nullable), notes, created_at

RecurringOrderItem  recurring_order_id, product_id, quantity

RecurringOrderSkip  recurring_order_id, skip_date
```

### Notes
- **Guest = Customer with no password.** Signing up later with the same email sets a password on the existing row; order history carries over.
- **Contact details are copied onto the order** so staff can always reach the customer and profile edits don't rewrite past orders.
- **OrderItem snapshots name and price** so price changes never alter past orders.
- **`order_number`** is short and human-readable (e.g. `MS-1042`) — it gets read aloud at the counter.
- **One timestamp per status change** instead of a history table.
- **Payment status is separate from order status** — they change independently.
- **Notification setting:** `Branch.notifications_enabled`, default false, stored but not shown in the UI in MVP.
- **Staff accounts:** `staff` sees and manages their own branch; `owner` sees all branches and manages the shared catalog.

---

## 6. Payment

- Customer picks **one** method per order at checkout: pay online or pay at pickup. No split payments.
- Recurring orders are **always pay at pickup**.
- No weekly/monthly invoicing.
- Provider: **undecided** — check what the bakery already uses. If they use Square at the counter, Square online keeps everything in one dashboard; otherwise Stripe.

### Online payment flow
1. Order created with status `awaiting_payment`; customer redirected to provider.
2. Provider **webhook** confirms payment → order becomes `placed`, `payment_status: paid`, `paid_at` set. Only now visible to staff.
3. Abandoned `awaiting_payment` orders are never shown to staff and expire after ~1 hour.
- Trust the webhook, not the browser redirect.
- Webhook handler is idempotent (duplicate events change nothing).

### Pay at pickup
- Order created directly as `placed`, `payment_status: unpaid`.
- When staff mark an unpaid order `collected`, the admin asks them to confirm payment (one tap updates both).

### Refunds (MVP)
- Cancelled paid orders are refunded manually in the provider dashboard, then marked `refunded` in the admin.

---

## 7. Order Status Flow

```
awaiting_payment ──(webhook: paid)──► placed ──► ready ──► collected
       │                                │          │
       └──(expires ~1h)──► expired      └──────────┴──► cancelled
```

Staff can also go straight from `placed` to `collected` (see transitions table).

### Entry points
| Source | Starts at | Payment |
|---|---|---|
| Online checkout | `awaiting_payment` | online |
| Pay-at-pickup checkout | `placed` | unpaid |
| Generated recurring order | `placed` | unpaid (at pickup) |

### Transitions
| From | To | Who | Notes |
|---|---|---|---|
| awaiting_payment | placed | system (webhook) | sets `paid_at` |
| awaiting_payment | expired | system | never shown to staff |
| placed | ready | staff | sets `ready_at` |
| ready | collected | staff | prompts payment confirmation if unpaid |
| placed | collected | staff | customer arrives before the order is marked ready; same payment prompt |
| placed / ready | cancelled | staff | `cancellation_reason` required |

### Rules
- `collected`, `cancelled`, `expired` are final. Mistakes are fixed with a new order, not by reopening.
- **Exception — Undo on collect:** a paid order collected with one tap can be undone within ~5 seconds, returning it to its previous status (`placed` or `ready`). It is final once the Undo window has passed.
- **Customers cannot cancel online** — they call the branch; staff cancel in admin.
- **No-shows** = staff cancel a `ready` order with reason "not collected".
- Admin list shows `placed` and `ready` by default, grouped by pickup date; other statuses behind a filter.

---

## 8. Recurring Orders

- **Account required** (someone must be able to log in to manage it).
- Defined by: items + quantities, days of the week, branch.
- Items store **no price** — each generated order is priced at generation time.
- **Generation:** each order is created when the branch's cutoff passes before its pickup date (e.g. cutoff 2pm → Tuesday's order created 2pm Monday).
- Customer can edit or skip up until the cutoff.
- **Skip** = single date (`RecurringOrderSkip`). **Pause** = longer stretch (`status: paused`).
- **No duplicates:** unique constraint on `(recurring_order_id, pickup_date)` in `Order`.
- **Unavailable / sold-out item at generation time:** order is still generated without that item; the drop is recorded in `generation_note` (e.g. "Rye loaf ×4 skipped: sold out") and highlighted in the admin list.
- Always pay at pickup.

---

## 9. Admin (MVP)

- Staff login: staff see their own branch; owner sees all branches.
- Order list to check off (`placed → ready → collected`, or straight to collected).
- Paid / Unpaid label on each order.
- Payment confirmation prompt when collecting unpaid orders.
- Cancel with reason.
- Highlight orders with a `generation_note`.
- Manage product availability and "sold out for a date" per branch.
- Owner manages the shared product catalog.
- Notification setting present, off by default.

---

## 10. Acceptance Criteria

### 10.1 Customer checkout

**AC-C1 Branch selection**
- Customer selects a branch before adding items to the cart.
- The menu shows only products where `Product.is_active` and `BranchProduct.is_available` are true for that branch.
- Products sold out for the chosen pickup date are shown as sold out and cannot be added.

**AC-C2 Changing branch**
- If the cart has items and the customer switches branch, items not available at the new branch are removed and the customer is told which ones.

**AC-C3 Pickup date**
- Customer must choose a pickup date.
- Before the branch cutoff, the earliest date is the next day; after the cutoff, the earliest date is the day after that.
- The branch's closed days cannot be chosen, and are skipped when working out the earliest date.
- The pickup date is chosen on the menu screen (C2), before browsing, because sold-out status depends on the date.
- Items sold out on the chosen date cannot be ordered.

**AC-C4 Contact details**
- Guest: name, phone and email are required and validated. Errors say how to fix the field (e.g. "Enter a 10-digit mobile number, like 0491 570 006").
- Logged-in customer: details are prefilled from the account and can be edited for this order.
- Contact details are saved onto the order.

**AC-C5 Payment method**
- Customer must choose exactly one: pay online or pay at pickup.

**AC-C6 Online payment**
- Order is created as `awaiting_payment` and the customer is redirected to the payment provider.
- On webhook confirmation the order becomes `placed`, `paid`, with `paid_at` set, and appears in the admin list.
- A duplicate webhook event changes nothing.
- If payment fails or the customer backs out, they return to checkout with the cart intact; the order is never shown to staff and expires after ~1 hour.
- If the customer returns before the webhook arrives, they see a "confirming payment" state rather than a confirmation.
- If confirmation takes too long, the customer is told the order is safe and the confirmation will be emailed.
- After a failed or cancelled payment, checkout says the customer hasn't been charged, and items, details, notes and payment choice are all kept.

**AC-C7 Pay at pickup**
- Order is created as `placed`, `unpaid`, and appears in the admin list immediately.
- The customer goes straight to the confirmation (C7), skipping the confirming-payment screen.

**AC-C8 Totals**
- The total is calculated on the server from current product prices; prices sent from the browser are ignored.
- Each OrderItem stores the product name and unit price at the time of ordering.

**AC-C9 Confirmation**
- Confirmation page shows order number, branch name and address, pickup date, items, total, and payment status ("Paid" or "Pay at pickup").
- A confirmation email with the same details is sent to the contact email.
- The cart is cleared.

**AC-C10 Optional account**
- After a guest order, the customer is offered the option to create an account by setting a password; the order is linked to that account.

**AC-C11 Confirmation email (C13)**
- Subject: "Your Millstone order MS-XXXX for [day date]".
- Preview text depends on payment: paid → "Pickup at [branch]. Paid online, nothing to pay at the counter."; pay at pickup → "Pay $[total] when you collect."
- Content follows C7: order number (large, "Say this number at the counter"), pickup day, branch, address with directions link, items, total, payment label, a "Need to change or cancel?" box with the branch phone, and a "Create an account" link for guests.
- Built as table-based HTML with inline styles; fonts fall back to Georgia and Arial.

### 10.1a Accounts (sign in / sign up / reset)

**AC-U1 Sign up**
- Requires name, mobile, email and a password of at least 8 characters.
- If the email was used for guest orders, those orders stay linked to the new account.

**AC-U2 Sign in**
- A failed sign-in shows one message that doesn't say whether the email or the password was wrong.
- Signing in from checkout returns to checkout with details prefilled, keeping notes and payment choice. Checkout also offers "Continue as a guest".

**AC-U3 Reset password**
- Entering an email always shows "Check your email", whether or not an account exists.
- The email link leads to "Set a new password" → "Password saved". Expired links show "This link has expired" with a way to request a new one.

### 10.2 Recurring orders

**AC-R1 Access**
- Only logged-in customers can create recurring orders.
- A guest who tries is asked to sign in or create an account first.

**AC-R2 Creating**
- Customer must choose a branch, at least one item (quantity ≥ 1), and at least one day of the week. The branch's closed days cannot be chosen.
- Items show "$X each today", since generated orders are priced on the day.
- Only products available at the chosen branch can be added.
- Customer sets a start date (earliest date follows the same cutoff rule as checkout, AC-C3). End date is optional.
- New recurring orders start as `active`.

**AC-R3 Viewing**
- Customer sees a list of their recurring orders with branch, items, days, status, and the next pickup date.

**AC-R4 Editing**
- Customer can change items, quantities, and days.
- Changes apply only to pickup dates whose cutoff has not passed; orders already generated are unaffected.
- The branch cannot be changed. To order from a different branch, the customer ends this recurring order and creates a new one.

**AC-R5 Skipping a date**
- Customer can skip any upcoming pickup date before its cutoff, and undo the skip before the cutoff.
- After the cutoff the order already exists; changes go through a phone call to the branch (same as regular orders).

**AC-R6 Pausing and resuming**
- Pausing stops generation for all pickup dates whose cutoff has not passed.
- Resuming restarts generation from the next pickup date whose cutoff has not passed. Missed dates are not back-filled.
- Already-generated orders are unaffected by pausing.

**AC-R7 Ending**
- Customer can end a recurring order with "Stop now" or "After a pickup day" (the date picker only offers that order's pickup days); `ends_on` is set and no further orders are generated after it.
- Orders already generated still stand when a recurring order is paused or ended. The upcoming list keeps showing them, locked, with "call to change".

**AC-R8 Generation**
- When a branch's cutoff passes, an order is generated for each recurring order at that branch where the next day:
  - matches one of its days of the week,
  - is within `starts_on` / `ends_on`,
  - is not skipped,
  - is not one of the branch's closed days,
  - and the recurring order is `active`.
- Generated orders are `placed`, `payment_method: at_pickup`, `payment_status: unpaid`, with `recurring_order_id` set.
- Contact details are copied from the customer's account.
- Items are priced at current product prices, snapshotted onto each OrderItem.
- Running generation more than once for the same date never creates a duplicate order (unique `(recurring_order_id, pickup_date)`).

**AC-R9 Unavailable items**
- Items unavailable or sold out at the branch on the pickup date are left out of the generated order.
- Each dropped item is listed in `generation_note` (e.g. "Rye loaf ×4 skipped: sold out").
- If every item is unavailable, the order is still generated with no items and a note, so staff see it and can call the customer.

**AC-R10 Visibility**
- Generated orders appear in the admin list like any other order, with a "Recurring" label.
- Orders with a `generation_note` are highlighted in the admin list.
- Generated orders appear in the customer's order history, including any `generation_note`.

### 10.3 Admin order list

**AC-A1 Access**
- The admin area requires a staff login; customer accounts cannot access it.
- A `staff` user sees only their own branch's orders.
- The `owner` sees all branches, with a branch filter.

**AC-A2 Default list**
- Shows `placed` and `ready` orders, grouped by pickup date, earliest first.
- Each order shows: order number, customer name and phone, items summary, total, Paid/Unpaid label, "Recurring" label if generated, and customer notes.
- Orders with a `generation_note` are highlighted.
- `awaiting_payment` and `expired` orders are never shown.
- For the owner, each date group is split under branch headings.
- Cancelled pay-at-pickup orders show no payment label (nothing was paid). Cancelled online orders show Paid (refund still owed) or Refunded.

**AC-A3 Finding orders**
- Staff can filter by pickup date and status (including `collected` and `cancelled`).
- Staff can search by order number, customer name, or phone.

**AC-A4 Auto-refresh**
- The list refreshes automatically (every ~30–60 seconds) so new orders appear without reloading the page.

**AC-A5 Order detail**
- Opening an order shows all items, contact details, notes, `generation_note`, payment method and status, and status timestamps.

**AC-A6 Mark ready**
- One tap moves `placed → ready` and sets `ready_at`.

**AC-A7 Mark collected**
- Paid order: one tap moves `placed` or `ready → collected` and sets `collected_at`, then shows "MS-XXXX collected · Undo" for ~5 seconds. Undo returns the order to its previous status. Only one Undo is available at a time.
- Unpaid order: a dialog asks "Has [name] paid?" and shows the amount. "Yes, paid · Collected" sets `payment_status: paid`, `paid_at` and `collected` in one action. No Undo afterwards.

**AC-A8 Cancel**
- Staff can cancel `placed` or `ready` orders.
- A reason is required: "Not collected", "Customer request", or "Other" with text.
- If the order was paid online, staff see a reminder to refund it in the payment provider's dashboard.

**AC-A9 Mark refunded**
- Available only on cancelled orders that were paid.
- Sets `payment_status: refunded` and `refunded_at`.

**AC-A10 Final orders**
- `collected` and `cancelled` orders are read-only (apart from AC-A9).

### 10.4 Catalog & availability

**AC-P1 Managing products (owner only)**
- Owner can create and edit products: name, description, category, price, image, active.
- Category is chosen from existing categories or a new one is typed in.
- A new product is available at all branches by default.

**AC-P2 Deactivating a product**
- A deactivated product disappears from every branch's menu.
- Existing orders are unaffected (item names and prices are snapshotted).
- Recurring orders containing it drop it at generation, with a `generation_note`.

**AC-P3 Price changes**
- Apply to new orders and to recurring orders generated after the change; existing orders keep their original prices.

**AC-P4 Branch availability**
- Staff (own branch) and owner (any branch) can switch a product on or off for a branch.
- Switched-off products disappear from that branch's menu only.

**AC-P5 Sold out for a date**
- Staff can mark a product sold out for a pickup date; the date defaults to the earliest orderable date.
- Customers cannot order it for that date at that branch, and recurring orders drop it for that date with a `generation_note`.
- Staff can undo it before the date passes.

---

## 10a. Design System (Millstone)

- **Palette:** flour-and-crust — warm cream backgrounds, dark brown text, burnt-crust brown for actions, wheat for warmth, sage for Ready/Paid, brick for Cancelled/errors, muted blue for Recurring and focus. All text meets contrast requirements.
- **Fonts:** Bitter (headings, product names) and Atkinson Hyperlegible (everything else, chosen so order numbers and phone numbers are easy to read). Both free Google Fonts.
- **Light theme only** (admin used under bright shop lighting).
- **Two contexts:** customer default = 48px controls, 16px text. `data-context="admin"` = 64px controls, 72px Ready/Collected buttons, 20px text, nothing under 16px. Admin rules: no swipes or hidden menus, every action has a word.
- **Components:** Button, ProductCard, TextField, QuantityStepper, ChoiceGroup, DatePicker, Toggle, StatusBadge, PaymentLabel, RecurringLabel, OrderRow, RecurringStatusTag, WeekdayPicker.
- **Label rules:** status badges are rounded pills; payment and Recurring labels are square tags. Every badge has an icon and a word. Unpaid is the loudest label (solid wheat); Paid is a green outline; Refunded is quietest (dashed outline). Collected is a quiet grey pill.
- **No logo yet:** "Millstone" set in Bitter; product cards show the first letter until real photos exist.

---

## 11. Screen Inventory (brief for Claude Design)

**Status:** designed, except A1 and C3 (customer canvas: C1–C13 without C3; admin canvas: A2–A5 + A3 panel). A1 (staff login) and C3 (product detail) were not designed; they are built from existing patterns (see section 13).

### Design notes
- **Customer side:** mobile-first — most customers will order from their phone.
- **Admin side:** tablet-first, used at the counter during service. Large tap targets, large readable text, minimal steps — the owners are not tech-savvy and staff are busy.
- **Brand:** Millstone is an original brand; no real bakery names, logos or photos.
- Visual direction to be decided in Claude Design.

### Customer screens

| # | Screen | Shows / does | Related AC |
|---|---|---|---|
| C1 | Home / branch picker | Short intro and how ordering works; the 3 branches with address, phone and order cutoff time; choose a branch | AC-C1 |
| C2 | Menu | Selected branch and pickup date (both changeable) at the top; products grouped by category with image, name, price; sold-out state; add to cart; cart summary bar | AC-C1, C3 |
| C3 | Product detail (modal) | Image, description, price, quantity, add to cart | AC-C1 |
| C4 | Cart | Items and quantities (editable), total, branch, pickup date | AC-C2, C8 |
| C5 | Checkout | Contact details (prefilled when logged in), order notes, payment method choice (online / at pickup), place order | AC-C4, C5 |
| C6 | Confirming payment | Waiting state after returning from the payment provider, until the webhook confirms | AC-C6 |
| C7 | Order confirmation | Order number, branch name and address, pickup date, items, total, payment status; guests get an option to create an account | AC-C9, C10 |
| C8 | Sign in / sign up / reset password | Standard account screens | — |
| C9 | My account | Profile details; order history including any notes on recurring orders | AC-R10 |
| C10 | My recurring orders | List with branch, items, days, status, next pickup date | AC-R3 |
| C11 | Recurring order form | Create or edit: branch (locked when editing), items and quantities, days of week, start and end date | AC-R2, R4 |
| C12 | Recurring order detail | Upcoming pickup dates with skip/undo; pause/resume; end | AC-R5, R6, R7 |
| C13 | Confirmation email | Same details as C7 | AC-C9 |

**Customer dialogs / states:** branch-change warning listing removed items (AC-C2); payment failed or cancelled → back to checkout with cart intact (AC-C6); sign-in prompt when a guest tries to create a recurring order (AC-R1); empty cart; empty order history.

### Admin screens

| # | Screen | Shows / does | Related AC |
|---|---|---|---|
| A1 | Staff login | Email and password | AC-A1 |
| A2 | Order list | Orders grouped by pickup date; Paid/Unpaid and Recurring labels; highlighted generation notes; quick Ready / Collected buttons; filters (date, status, branch for owner); search; auto-refresh | AC-A2, A3, A4, A6, A7 |
| A3 | Order detail (side panel) | All items, contact details, notes, generation note, payment info, timestamps; actions: ready, collected, cancel, mark refunded | AC-A5 – A10 |
| A4 | Branch availability | Product list for the branch with on/off switch and "sold out for [date]" control | AC-P4, P5 |
| A5 | Products (owner only) | Product list with active state; create/edit form (name, description, category, price, image, active) | AC-P1 – P3 |

**Admin dialogs / states:** confirm payment received when collecting an unpaid order (AC-A7); cancel with reason (AC-A8), including the refund reminder for online-paid orders; empty order list ("No orders for this date").

---

## 12. Open Items

- Payment provider (Square vs Stripe) — check what the bakery uses.
- Same-day orders: allowed or not? (Current rule: next day at the earliest.)
- Closed days: confirm whether branches really close on Mondays, and how public holidays are handled.
- Confirm assumptions: pickup only, date not time slot ("any time that day").
- Real product photos (currently letter placeholders).
- Sample data differs slightly between the customer and admin canvases (e.g. some phone numbers) — cosmetic only; seed data in code should follow the sample data rule in section 4.

---

## 13. Decisions after design

_Recorded 30 Sep 2026, during project setup._

- **Pickup time copy:** keep "We'll have it ready from 7am". The time comes from a new `Branch.opens_at` field (default 07:00), added in the data-model step.
- **A1 Staff login:** not designed. Reuse the C8 sign-in layout at admin size (`data-context="admin"`).
- **C3 Product detail:** not designed. A bottom sheet using the same sheet pattern as `design/customer/CartBranchSheet.dc.html`, built from existing components.
