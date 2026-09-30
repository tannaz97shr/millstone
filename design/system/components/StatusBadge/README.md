# StatusBadge

The order's status in one word with a shape: **Placed** (open ring, wheat), **Ready** (check, solid sage), **Collected** (check, quiet grey), **Cancelled** (cross, dashed brick).

**Props:** `status` (`placed` | `ready` | `collected` | `cancelled`), optional children to override the word (keep it one word).

- Only these four exist in the UI. `awaiting_payment` and `expired` are never shown to staff; the customer's waiting state is a page, not a badge.
- Ready is the only solid fill — it is the one staff scan for. Placed and Ready differ in lightness (light wheat vs dark sage), icon and word, so they read apart for colour-blind staff and in glare.
- Pill shape (`radius-full`) is reserved for status. Payment and Recurring are square-cornered tags so staff never confuse "Paid" with "Ready".
