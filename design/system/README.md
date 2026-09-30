Millstone is a neighbourhood bakery with three branches. Online ordering is for next-day pickup; nothing is delivered. The system serves two places: the **customer ordering site** (phones first) and the **staff admin** (a tablet on the counter, used mid-service by people who are not "computer people"). It should feel like the shop: warm, plain, made by hand, a little old-fashioned on purpose. Nothing here should date by next year.

## Voice

Write like the person behind the counter talks — short, friendly, specific.

- Plain words, "you" and "we". "We'll have it ready from 7am." Not "Your order has been successfully submitted."
- Name the thing, the day and the place: "Pickup Tue 30 Sep at Northcote." Dates always carry the weekday.
- Sentence case everywhere, including buttons: "Place order", "Mark ready". No exclamation marks, no emoji, no "Oops".
- Tell people what to do, not what went wrong: "Enter a 10-digit mobile number, like 0491 570 006."
- Money: `$9.50`, always two decimals. Order numbers: `MS-1042`, always with the prefix — it is read aloud.
- On the admin, verbs on buttons, one to two words: Ready, Collected, Cancel order. Never jargon (no "status", "fulfil", "sync").

## Two contexts

Every component reads its size from the nearest `data-context` attribute. Customer is the default; put `data-context="admin"` on the admin root.

| | Customer site | Staff admin |
|---|---|---|
| Designed for | Phone, one thumb, 360–430px | Tablet landscape, arm's length, bright shop light |
| Controls | `control-h` 48px, `tap-min` 48px | `control-h-admin` 64px, `tap-min-admin` 64px; Ready/Collected `action-h-admin` 72px |
| Text | `body` 16px; nothing below `caption` 14px | `admin-body` 20px; nothing below `admin-caption` 16px |
| Gutters | `space-4` page gutter, `space-6` between sections | `space-8` gutter, `space-5` row padding |
| Layout | One column; a sticky cart bar at the bottom | Order list left, detail as a side panel right; list rows are full-width cards |

Admin rules: one screen does one job; the next action is always a visible button on the row (no swipe gestures, no hidden menus, no long-press).

How final actions are confirmed:

- **Collected, paid order:** one tap, no dialog. A message in `sage-soft` with a `sage` edge says "MS-1043 collected" with an **Undo** button, and stays for about 5 seconds. Undo puts the order back to the status it had (Placed or Ready). One Undo at a time: a new action replaces the message.
- **Collected, unpaid order:** a plain dialog asks whether the customer has paid, repeating the order number and amount. "Yes, paid · Collected" marks it paid and collected in one step; there is no Undo after it.
- **Cancel order:** a plain dialog that repeats the order number and asks for the reason. No Undo.

## Colour

A flour-and-crust palette on one light theme, `Flour`. The admin runs under bright light, so there is no dark theme.

- Ground is `flour`; cards, inputs and sheets are `flour-raised`; insets and placeholders are `flour-sunk`. Text is `ink`, secondary text `ink-muted`.
- `crust` is the only action colour: primary buttons, the selected date, a toggle that is on, links. Text on it is `on-crust`. Use it sparingly — one primary per screen.
- `wheat` is warmth, not information: dividers, the cover, the Unpaid label (with `ink` text) and the edge of a flagged order row. Never text.
- Status colours each own one meaning: `wheat-soft`/`wheat-ink` = Placed and generation notes; `sage` = Ready and Paid; `brick` = Cancelled, errors and destructive actions; `delft` = Recurring and keyboard focus.
- Every status also carries a word and an icon, and Placed/Ready/Cancelled differ in lightness as well as hue, so nothing depends on telling red from green.
- Hairlines are `line`; anything you can tap has a `line-strong` edge (3:1 or better).

## Type

- **Bitter** (slab serif, 600/700) for screen titles, category headings and product names — it has the plain, stamped look of a flour sack or a chalkboard, without being a boutique script.
- **Atkinson Hyperlegible** (400/700) for everything people read or type. It was drawn for low-vision readers; 0/O and 1/l/I are unmistakable, which matters for order numbers and phone numbers read across a counter.
- Customer styles: `page-title`, `section-title`, `product-name`, `body`, `body-strong`, `price`, `caption`. Admin styles: `admin-title`, `admin-order-number`, `admin-body`, `admin-strong`, `admin-caption`.
- Prices and quantities use tabular figures. Keep line length under ~65 characters on the customer site.

## Space, shape, depth

- 4px base: `space-1` … `space-12`. Customer screens live between `space-3` and `space-6`; the admin steps up to `space-5`–`space-8`.
- Corners are softened, never bubbly: `radius-md` (10px) on buttons, inputs and date tiles, `radius-lg` (16px) on cards and sheets, `radius-sm` (4px) on the square tags (PaymentLabel, RecurringLabel, RecurringStatusTag). `radius-full` is kept for status badges and the toggle track, so shape alone separates status from payment.
- Depth is quiet: `shadow-card` on cards and admin rows, `shadow-sheet` on bottom sheets, the product modal and the admin side panel. Borders do most of the work.
- Focus is `focus-ring` on every control: a 2px `flour` gap then 3px of solid `delft`.
- Motion is minimal: 120–150ms colour and position changes only. No bouncing, no skeleton shimmer; the admin auto-refresh swaps rows in place without animation.

## Imagery and iconography

- There is no logo yet. Set "Millstone" in Bitter 700 in `ink`; do not draw a mark, a wheat sheaf or a millstone.
- Photos: real Millstone bakes only, natural light, plain bench or paper, 4:3. No stock photos, no people's faces, no filters. Until photos exist, product cards show the product's initial on `flour-sunk`.
- Icons: a small set drawn inline by the components (`Icon`: check, cross, ring, repeat, note, alert, plus, minus, left, right, refund — the return arrow on Refunded and Undo) — 24px grid, 2.25 stroke, round caps, `currentColor`. An icon never appears without a word next to it on the admin. No emoji.

## Order states in the UI

| Data | Shown as |
|---|---|
| `placed` | StatusBadge `placed` — "Placed" |
| `ready` | StatusBadge `ready` — "Ready" (the only solid badge) |
| `collected` | StatusBadge `collected` — "Collected" |
| `cancelled` | StatusBadge `cancelled` — "Cancelled" |
| `payment_status: paid` | PaymentLabel `paid` — "Paid" |
| `payment_status: unpaid` | PaymentLabel `unpaid` — "Unpaid" (admin) / "Pay at pickup" (customer) |
| `payment_status: refunded` | PaymentLabel `refunded` — "Refunded" (quiet dashed outline; only beside Cancelled) |
| `cancelled` + `payment_method: at_pickup` | No payment label, in the list or the detail panel; the panel says "Nothing was paid." |
| `cancelled` + `payment_method: online` | Keep the label: "Paid" means a refund is still owed; "Refunded" means it's done |
| `recurring_order_id` set | RecurringLabel — "Recurring" |
| RecurringOrder `status: active` | RecurringStatusTag `active` — "Active" |
| RecurringOrder `status: paused` | RecurringStatusTag `paused` — "Paused" (dashed edge) |
| RecurringOrder `ends_on` passed | RecurringStatusTag `ended` — "Ended" (faint, no fill) |
| `generation_note` set | The whole admin row on `wheat-soft`, the note in `wheat-ink` under the items |

`awaiting_payment` and `expired` never appear to staff. The admin list is built from OrderRow, which lays these out in this order: order number (`admin-order-number`), StatusBadge, PaymentLabel, RecurringLabel, then the total.
