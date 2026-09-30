# WeekdayPicker

Pick one or more days of the week, as tiles that match the DatePicker's day strip: the same `line-strong` edge, `radius-md` corners and `crust` fill when chosen. A day the branch is closed stays in its place, dashed, with the word "Closed" under it, and can't be picked.

**Props:** `value` + `onChange` (an array of weekday numbers, 0 = Sunday … 6 = Saturday — the same numbers as DatePicker's `closedWeekdays`) or `defaultValue`, `closedWeekdays`, `order` (default Monday first), `closedText` (default "Closed"), `label`, `hint`, `error`, `disabled`.

- Used for the pickup days of a recurring order (C11). `onChange` returns the days in display order, so they can be saved as they are.
- Each tile is a toggle button (`aria-pressed`), so screen readers hear "Tuesday, pressed". Closed days are disabled and announced as "Monday, closed".
- Four columns on the customer site, so a phone gets two rows of big tiles; one row of seven on the admin.
- Write the hint as the rule that matters: "Choose one or more. We make each order at 2pm the day before."
- Errors say what to do: "Choose at least one day." Unchosen tiles get a `brick` edge alongside the message.
- Don't use it for one-off pickups; that's the DatePicker.
