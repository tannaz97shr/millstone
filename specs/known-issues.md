# Known issues and open items

Maintained by Claude Code. The spec (`millstone-spec.md`) stays the source of truth; this file tracks loose ends.

## Undeployed infra steps

- **No real Firebase project yet.** Local dev runs on the emulator (`demo-millstone`). Before deploying: create the Blaze project, run `firebase deploy --only firestore:rules,firestore:indexes,storage`, and set `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` in the host's env.
- **Emulator needs a JDK (21+)** installed locally (`brew install --cask temurin@21`).

## Deferred features

- **Admin free-text search (AC-A3).** Firestore can't do substring search on name or phone. The admin step needs a lowercased search field (or prefix tokens) on orders, plus an index for it.
- **Category display order.** Products store `category` as a free-text name ("Breads"). Nothing yet says Breads → Pastries → Bagels. The menu step needs an order (e.g. a small categories config or a `sortOrder` field).
- ~~**Phone display formatting.**~~ Resolved 30 Sep 2026 (step 2): `formatPhone` in `src/shared/utils/phone.ts` ("0491 570 156", "03 7010 2140"; landlines changed from "(03) 7010 2140" on 1 Oct 2026 to match spec section 4's branch table and the designs), used by OrderRow. Later screens that show a phone should use it too.

- **Shared patterns not built yet (step 2).** These repeat across screens but belong with their features: the admin side panel (A3 order detail, A5 product form), the customer cart summary bar (C2/C4), admin nav, admin filter buttons with a pressed ink fill (A2/A4), empty-state boxes, admin uppercase section headings, the order-detail items table, and a link styled as a Button. ProductCard photos will need `images.remotePatterns` for Firebase Storage once uploads exist.

## Investigated but unreproduced bugs

_None yet._

## Un-applied migration scripts

_None yet._

## Data model notes

- **Deviations from spec section 5 (by design):** money is stored as integer cents (`priceCents`, `totalCents`, …), not decimals. Order items and recurring-order items/skips are embedded arrays, so `OrderItem.id` / `order_id` don't exist. Email uniqueness is enforced with `customerEmails` / `staffEmails` lock docs.
- **Fruit loaf is Northcote-only in the seed.** No design has a branch-only product, so the seed also switches Fruit loaf off at Brunswick. The admin Products canvas shows "At 2 of 3 branches · not Fitzroy" for it.
- **Seed sold-out dates follow the real clock.** They're set to each branch's earliest (and second) pickup date at seed time. A rerun on a later day moves them forward, and the designs' fixed dates (sold out Wed 30 Sep) won't match literally.

## Known UX gaps

- **Design-system inconsistencies found while building the components (step 2).**
  - The A5 product form (`design/admin/Products.dc.html`) has a **delft** info note, but `design/system/README.md` keeps delft for Recurring and focus only. **Decided 30 Sep 2026: the README wins.** `Notice tone="info"` uses the plain style of the A5 price-change note (flour ground, line-strong edge); no notice uses delft. The products step should build the "New products go on the menu…" note with this tone, not the blue in the canvas.
  - `bundle.css` has two literal colours outside the tokens: the Ready button hover `#2f5530` (added as `--color-sage-deep` in `globals.css`, not in `tokens.json`) and an error-field background `#fffaf8` (dropped; error fields keep `flour-raised` with the brick edge).
  - ChoiceGroup has no error state in `index.d.ts`, but the checkout errors screen shows "Choose how you'd like to pay." under it. The component takes an extra `error` prop so it's announced with the group.
  - The month grid starts the week on Sunday (as in the design bundle) while WeekdayPicker starts on Monday (as its README says). Left as designed.
  - On a 390px phone the month grid's day cells are 48px high but about 44px wide: seven 48px columns don't fit. The strip (the customer's main picker) is unaffected. Only C11's start/end dates use the month grid on a phone.
  - OrderRow's "Details" link is 64px high (the admin tap size), not the 48px in the design bundle.
  - ProductCard lets the price and the stepper wrap onto two lines on a narrow two-column card, so the stepper buttons stay 48px wide. In the design bundle they shrink instead.
  - Admin WeekdayPicker drops to 4 columns below about 500px wide: seven 64px tiles don't fit. The admin is tablet-only (designed at 1180px), so this is left as is.
  - OrderRow's two half-width buttons (Ready/Collected and Details) are tight at 390px for the same reason: admin tap sizes on a phone-width screen. Left as is.
  - Dialog action rows on the admin never shrink a button below its label. If a dialog is ever too narrow for the row, the secondary button drops to its own line.
  - The Notice dismiss button is labelled "OK" on screen and `aria-label="Dismiss message"` in the design. The accessible name is "OK, dismiss message" so it contains the visible word (WCAG 2.5.3).
- **Wrong weekday in design-system docs.** `design/system/README.md` ("Pickup Tue 30 Sep at Northcote"), the `admin-title` sample in `tokens.json` ("Today · Tue 30 Sep") and the ProductCard docs ("Sold out for Tue 30 Sep") say Tuesday. 30 Sep 2026 is a Wednesday. The code always derives weekday names from the date.

## Tooling and housekeeping

- ~~**`/dev/tokens` is publicly reachable.**~~ Resolved 30 Sep 2026 (step 2): every `/dev/*` page (`/dev/tokens`, `/dev/components`) is gated by `src/app/dev/layout.tsx` and returns 404 in production builds. Setting the server-only env var `DEV_PAGES=true` for both `bun run build` and `bun run start` turns them back on, for QA against a production build (`/dev/components` is rendered per request, so it needs the variable at start as well).
- **ESLint held at 9, TypeScript held at 6.0.** `eslint-plugin-react` (via `eslint-config-next`) doesn't support ESLint 10 yet, and `typescript-eslint` needs TypeScript below 6.1. Upgrade once they catch up.
- ~~**Node 21.1.0 locally.**~~ Resolved 30 Sep 2026: Node 24.21.0 (LTS) installed via nvm. Build, lint and `bun test` pass on it. nvm's default alias still points at v21.1.0, so new non-interactive shells pick 21 until `nvm alias default 24` is run.
- **Stray `~/package-lock.json`** outside the repo made Next guess the wrong workspace root. `turbopack.root` is pinned in `next.config.mjs` to work around it.
- **`next-env.d.ts` is tracked** even though `.gitignore` lists it; Next regenerates it on every build.
