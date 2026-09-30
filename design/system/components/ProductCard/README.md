# ProductCard

A menu item on the customer site: photo (or a plain initial when there is no photo yet), name, short description, price and an Add button that becomes a quantity stepper once it is in the cart.

**Props:** `name`, `price` (a number, shown as `$9.50`, or a preformatted string), `description` (one line), `image` + `imageAlt`, `quantity` + `onQuantityChange` (shows the stepper when quantity > 0), `onAdd`, `soldOut` (`true` or the sentence to show, e.g. "Sold out for Tue 30 Sep"), `layout` (`"row"` for the cart and narrow lists).

The consumer provides the grid: two columns on phones (`minmax(160px, 1fr)`), three to four on wider screens, `space-3` gaps.

- Sold out names the date — sold out is per pickup date, not forever. The price is struck through and there is no Add button.
- Photos: real, plain, natural light on a bench or paper, cropped 4:3. No stock photography, no props, no filters. Until real photos exist, leave `image` empty — the initial on `flour-sunk` is intentional, not a broken image.
- Don't put badges ("Popular", "New") on cards; the MVP has no such data.
