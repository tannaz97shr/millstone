# Known issues and open items

Maintained by Claude Code. The spec (`millstone-spec.md`) stays the source of truth; this file tracks loose ends.

## Undeployed infra steps

- **No real Firebase project yet.** Local dev runs on the emulator (`demo-millstone`). Before deploying: create the Blaze project, run `firebase deploy --only firestore:rules,firestore:indexes,storage`, and set `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` in the host's env.
- **Emulator needs a JDK (21+)** installed locally (`brew install --cask temurin@21`).

## Deferred features

- **Admin free-text search (AC-A3).** Firestore can't do substring search on name or phone. The admin step needs a lowercased search field (or prefix tokens) on orders, plus an index for it.
- ~~**Category display order.**~~ Resolved 1 Oct 2026 (step 3): `settings/catalog` holds `categoryOrder` (seeded Breads, Pastries, Bagels). Categories not listed go last, A–Z. When A5 lets the owner type a new category, it should append it to this list.
- **C1 header Sign in and "For cafes and regulars" (step 3).** Both are in `design/customer/Home.dc.html` and left out until the accounts and recurring-order steps. The C2 header Sign in is left out for the same reason.
- ~~**Phone display formatting.**~~ Resolved 30 Sep 2026 (step 2): `formatPhone` in `src/shared/utils/phone.ts` ("0491 570 156", "03 7010 2140"; landlines changed from "(03) 7010 2140" on 1 Oct 2026 to match spec section 4's branch table and the designs), used by OrderRow. Later screens that show a phone should use it too.

- **Shared patterns not built yet (step 2).** These repeat across screens but belong with their features: the admin side panel (A3 order detail, A5 product form), admin nav, admin filter buttons with a pressed ink fill (A2/A4), empty-state boxes, admin uppercase section headings and the order-detail items table. ProductCard photos will need `images.remotePatterns` for Firebase Storage once uploads exist. Built in step 3: the link styled as a Button (`atoms/ButtonLink`) and the sticky bottom bar (`organisms/BottomBar`, used by C1 and the C2 order bar); C4's bar should use `BottomBar` too.

## Investigated but unreproduced bugs

_None yet._

## Un-applied migration scripts

_None yet._

## Data model notes

- **Deviations from spec section 5 (by design):** money is stored as integer cents (`priceCents`, `totalCents`, …), not decimals. Order items and recurring-order items/skips are embedded arrays, so `OrderItem.id` / `order_id` don't exist. Email uniqueness is enforced with `customerEmails` / `staffEmails` lock docs.
- **Fruit loaf is Northcote-only in the seed.** No design has a branch-only product, so the seed also switches Fruit loaf off at Brunswick. The admin Products canvas shows "At 2 of 3 branches · not Fitzroy" for it.
- **Seed sold-out dates follow the real clock.** They're set to each branch's earliest (and second) pickup date at seed time. A rerun on a later day moves them forward, and the designs' fixed dates (sold out Wed 30 Sep) won't match literally.
- **Additions in step 3 (not in spec section 5).**
  - `Branch.displayOrder` (Northcote 1, Fitzroy 2, Brunswick 3): C1 lists the branches in that order, which is neither A–Z nor doc-ID order.
  - `settings/catalog` `{ categoryOrder }`: see Deferred features.
  - The client-side cart (`localStorage`, key `millstone:cart:guest`; later `millstone:cart:{customerId}`) stores each line's product **name** but never a price. The name is only for "We took X out" messages after a branch switch, when the new branch's menu no longer has the product. The cart also records the branch and date it was last checked against (`checkedAgainst`), so a branch switch is still recognised after a reload.

## Known UX gaps

- **Design-system inconsistencies found while building the components (step 2).**
  - The A5 product form (`design/admin/Products.dc.html`) has a **delft** info note, but `design/system/README.md` keeps delft for Recurring and focus only. **Decided 30 Sep 2026: the README wins.** `Notice tone="info"` uses the plain style of the A5 price-change note (flour ground, line-strong edge); no notice uses delft. The products step should build the "New products go on the menu…" note with this tone, not the blue in the canvas.
  - The customer's sticky bottom bar shadow (`0 -2px 0 …, 0 -6px 16px …`, from the C1/C2 design files) isn't in `tokens.json`. It's added as `--shadow-bar` in `globals.css`. A `branch-name` type style (Bitter 600 20/26, as on C1 and C2) is added the same way.
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
- **Branch picker and menu (step 3): deliberate differences from the designs.**
  - **Undesigned copy.**
    - C3 product detail: "Add to order · $9.60", "Update order · …", "Remove from order", "How many?", and a sold-out line.
    - A pickup day whose cutoff passed, from a stored cart or an old link: "Orders for Thu 1 Oct have closed, so your pickup is now Fri 2 Oct."
    - A product switched off or retired while in the cart: "…because it's no longer on the Northcote menu."
    - An empty menu, the 404 page, a failed load with "Try again", and a cart `localStorage` can't read or write.
  - **Products within a category are listed A–Z.** The canvas order (rye, seeded, white, fruit) isn't stored anywhere. A product sort order would need A5 to manage it.
  - **The day strip always starts tomorrow** (as in `AfterCutoff.dc.html`), so after the cutoff the missed day shows struck through. Before the cutoff, tomorrow is the earliest day, as in `Menu.dc.html`.
  - **C1 → C2 switching has no confirmation**, as designed (HomeReturn warns in advance). An old link to another branch's menu also switches the cart's branch and names what was removed, without asking first. C4's change-branch sheet (next step) asks first, as designed.
  - **The C2 Change button is a link back to C1**, as in the design's flow (`Main.dc.html`), not a sheet.
  - **At 1180px the customer side stays a 640px column**, so the C2 order bar is 640px wide and the menu keeps two columns.
  - **The C1 notice, C2 notices and C3 sheet use the shared components** (`Notice`, `Sheet`) rather than the canvas's inline styles. For example, the C2 notices show the Notice's "OK" with the accessible name "OK, dismiss message".
  - **C1 → C2 navigation** from the bottom bar and "Back to the … menu" uses real links (`ButtonLink`), so they open in a new tab and announce as links.
- **A branch chosen before the page has hydrated isn't picked up.** On a slow connection, a customer who taps a C1 branch before the scripts load sees the radio checked, but the bottom bar stays on "Choose a branch first" until they tap again. Found in the keyboard QA run against `next dev`, where hydration is slow. A fix would read the checked radio on mount.
- **The first server render can't see the cart.** The server prefetches the URL's date (or the earliest). Internal links always carry the cart's date, so this only matters for a hand-typed `/menu/{branch}` URL: the browser then moves to the cart's date and fetches that menu.
- **Server prefetch bypasses Axios.** Pages prefetch through the same service functions the API routes use (`getBranchesResponse`, `getBranchMenu`) into TanStack Query. Every fetch in the browser goes through Axios and the `/api` routes.
- **Wrong weekday in design-system docs.** `design/system/README.md` ("Pickup Tue 30 Sep at Northcote"), the `admin-title` sample in `tokens.json` ("Today · Tue 30 Sep") and the ProductCard docs ("Sold out for Tue 30 Sep") say Tuesday. 30 Sep 2026 is a Wednesday. The code always derives weekday names from the date.

## Tooling and housekeeping

- ~~**`/dev/tokens` is publicly reachable.**~~ Resolved 30 Sep 2026 (step 2): every `/dev/*` page (`/dev/tokens`, `/dev/components`) is gated by `src/app/dev/layout.tsx` and returns 404 in production builds. Setting the server-only env var `DEV_PAGES=true` for both `bun run build` and `bun run start` turns them back on, for QA against a production build (`/dev/components` is rendered per request, so it needs the variable at start as well).
- **ESLint held at 9, TypeScript held at 6.0.** `eslint-plugin-react` (via `eslint-config-next`) doesn't support ESLint 10 yet, and `typescript-eslint` needs TypeScript below 6.1. Upgrade once they catch up.
- ~~**Node 21.1.0 locally.**~~ Resolved 30 Sep 2026: Node 24.21.0 (LTS) installed via nvm. Build, lint and `bun test` pass on it. nvm's default alias still points at v21.1.0, so new non-interactive shells pick 21 until `nvm alias default 24` is run.
- **Stray `~/package-lock.json`** outside the repo made Next guess the wrong workspace root. `turbopack.root` is pinned in `next.config.mjs` to work around it.
- **`next-env.d.ts` is tracked** even though `.gitignore` lists it; Next regenerates it on every build.
