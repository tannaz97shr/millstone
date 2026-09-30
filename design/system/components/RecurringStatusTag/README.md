# RecurringStatusTag

Where a recurring order stands, as a square stamp with a word: **Active** (check, solid `line-strong` edge), **Paused** (open ring, dashed edge) and **Ended** (cross, faint `line` edge, `ink-muted` text, no fill).

**Props:** `status` (`active` | `paused` | `ended`), optional children to change the word (keep it one word).

- Ended is derived, not stored: show it once `ends_on` has passed. Paused comes from `status: paused`; everything else is Active.
- It describes the recurring order, not a pickup. The orders it makes carry their own StatusBadge and the RecurringLabel.
- Sits beside the RecurringLabel on My recurring orders (C10) and the recurring order detail (C12). Pair Paused and Ended with a sentence that says what it means: "Paused. No new orders until you resume."
- Neutral on purpose: no status colour, so it never reads as Ready, Paid or Cancelled. The words, icons and edge styles carry the difference.
- Square corners (`radius-sm`) and uppercase, like PaymentLabel. Pills stay reserved for order status.
