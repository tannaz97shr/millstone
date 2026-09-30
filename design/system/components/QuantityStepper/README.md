# QuantityStepper

Minus / count / plus, for quantities in the cart, on product cards and in recurring order items.

**Props:** `value` + `onChange` (controlled) or `defaultValue`, `min` (default 0), `max` (default 99), `label` (the product name, used for screen-reader labels like "One more Plain bagel").

Each button is at least `tap-min` (48px) wide, `tap-min-admin` (64px) on the admin. Going to 0 in the cart removes the item — the minus button says "Remove" to screen readers at 1.
