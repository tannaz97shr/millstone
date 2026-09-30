# DatePicker

Picks one pickup date. Two layouts: a horizontal **day strip** for customers (the next 7–14 days as big tiles, thumb-scrollable) and a **month grid** for the admin date filter and for recurring start/end dates.

**Props:** `value` + `onChange` (ISO `YYYY-MM-DD`) or `defaultValue`, `earliest` (the first orderable date — the consumer applies the branch cutoff rule), `latest`, `unavailable` (ISO dates the branch is closed or the item is sold out), `closedWeekdays` (0 = Sunday), `layout` (`"strip"` default, or `"month"`), `start` and `days` (strip only), `today` (month only, outlines today), `label`, `note` (one line under it — use it for the cutoff rule).

- Always show the cutoff rule in `note` next to the strip: "Order by 2pm for next-day pickup."
- Unavailable days stay visible, dashed and struck through, so people see *why* a day is missing.
- No time slots — pickup is by date.
