# PaymentLabel

Where the money stands, as a square stamp: **Unpaid** (banknote, solid wheat with an ink edge — the loudest label on a row, because staff must take payment), **Paid** (check, sage outline) and **Refunded** (return arrow, dashed outline in `ink-muted` on no fill — the quietest, because nothing is left to do).

**Props:** `status` (`unpaid` | `paid` | `refunded`, matching `payment_status`), optional children to change the words (the customer site says "Pay at pickup" instead of "Unpaid").

- Square corners, uppercase — a stamp, not a status pill. It sits after the StatusBadge on an admin row.
- Payment is independent of order status: a Ready order can be Unpaid.
- Refunded only ever appears beside a Cancelled badge (a cancelled order that was paid online, refunded in the payment provider's dashboard, then marked refunded in the admin). A cancelled order still showing Paid is the cue that a refund is owed.
- Loudness follows the work left: Unpaid (act now) > Paid (done, reassuring) > Refunded (closed, history).
