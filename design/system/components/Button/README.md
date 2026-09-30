# Button

The one button: `primary` for the single next step on a screen, `secondary` for everything else, `quiet` for low-stakes links, `danger` for cancelling, `ready` for the admin's Collected action.

**Props:** `variant` (`primary` | `secondary` | `quiet` | `danger` | `ready`, default `secondary`), `icon` (`check`, `plus`, `cross`, `repeat`…), `block` (full width — use for the mobile checkout button), `counter` (admin only: the 72px `action-h-admin` height for Ready/Collected on an order row), `disabled`, plus any `<button>` attribute. Children are the label.

**Size comes from context.** Inside `data-context="admin"` every button grows to `control-h-admin` (64px) with 20px text; outside it, `control-h` (48px) with 16px text. Never set heights by hand.

- Do: one `primary` per screen or per admin row. Label with the verb and the thing — "Place order", "Mark ready", "Cancel order".
- Do: disable with a reason in the label ("Choose a date first") rather than a greyed button that says nothing.
- Don't: use `danger` fills; cancelling is an outlined brick button so it never looks like the main action.
- Don't: icon-only buttons on the admin. Every staff action has a word.
