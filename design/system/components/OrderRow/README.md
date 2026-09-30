# OrderRow

One order in the admin order list: the order number to read aloud, its status, payment and recurring labels, who it is for, what is in it, and the one or two buttons that move it on. Built for a tablet at the counter — use it only inside `data-context="admin"`.

**Props:** `orderNumber`, `status` (`placed` | `ready` | `collected` | `cancelled`), `payment` (`unpaid` | `paid` | `refunded`, or left out — see below), `customerName`, `phone`, `items` (a summary string, or `[{ quantity, name }]` which renders "2 × Rye loaf, 6 × Plain bagel"), `total`, `recurring` (shows the Recurring label), `notes` (customer notes), `generationNote` (highlights the row), `selected` (the order open in the side panel), `onReady`, `onCollected`, `onOpen`.

**What it shows, top to bottom:** order number · StatusBadge · PaymentLabel · RecurringLabel · total on the right; customer name and phone; items; "Note:" line; generation note; a "Details" link that opens the side panel. Buttons stack on the right at `action-h-admin` (72px).

**Buttons follow the status (AC-A6, AC-A7):**

| Status | Buttons |
|---|---|
| Placed | **Ready** (primary) and **Collected** (secondary) — a customer can arrive before it is marked ready |
| Ready | **Collected** (solid sage — the one thing left to do) |
| Collected, Cancelled | none; the row goes quiet (flour ground, muted text, no shadow) and is read-only |

**The consumer provides:**
- The list: rows in a single column with `space-4` gaps, grouped under `admin-title` pickup-date headings, earliest first.
- What happens after a tap. `onCollected` on a `paid` order collects it at once and shows the "MS-1043 collected · Undo" message for about 5 seconds (Undo restores the previous status). On an `unpaid` order it must open the "Has … paid?" dialog before anything changes, with no Undo after. Cancel and Mark refunded live in the detail panel, not on the row.
- Auto-refresh: swap rows in place, no animation, and never re-order a row the person is touching.

- A `generationNote` turns the whole row `wheat-soft` with a `wheat` edge, and the note sits in its own boxed line with an alert icon, so staff see it before they bag the order.
- **Payment label on cancelled orders:** leave `payment` out on a cancelled pay-at-pickup order — nothing was paid, and a loud Unpaid on a finished order would tell staff to take money. On a cancelled order paid online, always pass it: **Paid** means a refund is still owed, **Refunded** means it's done.
- Keep `items` to a summary line; the full list is in the detail panel.
- Don't hide the buttons behind swipes or a menu, and don't add more than two.
