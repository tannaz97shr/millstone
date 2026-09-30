# ChoiceGroup

A set of large radio cards for one choice with a short explanation under each option — payment method at checkout, cancel reason on the admin.

**Props:** `label` (the question), `options` (`[{ value, label, hint? }]`), `value` + `onChange` or `defaultValue`, `name`.

- Write the question as a question: "How would you like to pay?"
- Two to four options. More than that is a select, not cards.
- The whole card is the tap target; the selected card fills with `crust-soft` and a solid `crust` edge, not colour alone — the dot fills too.
