# Known issues and open items

Maintained by Claude Code. The spec (`millstone-spec.md`) stays the source of truth; this file tracks loose ends.

## Undeployed infra steps

- **No real Firebase project yet.** Local dev runs on the emulator (`demo-millstone`). Before deploying: create the Blaze project, run `firebase deploy --only firestore:rules,firestore:indexes,storage`, and set `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` in the host's env.
- **Emulator needs a JDK (21+)** installed locally (`brew install --cask temurin@21`).
- **No email provider (step 5).** Emails go through `sendEmail` (`src/shared/lib/email/`). In development, and in builds with `DEV_PAGES=true`, each one is saved to the gitignored `.dev-emails/` folder, logged to the console, and listed at `/dev/emails`. Anywhere else it is logged as unsent (warn) and nobody receives it. A provider and a sender address are needed before launch.
- **Emulator data is kept between runs (3 Oct 2026).** `bun run emulators` imports from the gitignored `.emulator-data/` on start and exports to it on exit. The export only happens on a clean stop (one Ctrl-C, then wait for "Export complete"); a second Ctrl-C or a killed terminal skips it and loses that session's changes. The first run with an empty folder logs "Could not find import/export metadata file, skipping data import!", which is expected. `bun run seed` still works on top (it's idempotent, and `--reset` still wipes). For a clean start, stop the emulator and delete `.emulator-data/`.

## Deferred features

- **Admin free-text search (AC-A3).** Firestore can't do substring search on name or phone. The admin step needs a lowercased search field (or prefix tokens) on orders, plus an index for it.
- ~~**Category display order.**~~ Resolved 1 Oct 2026 (step 3): `settings/catalog` holds `categoryOrder` (seeded Breads, Pastries, Bagels). Categories not listed go last, A–Z. When A5 lets the owner type a new category, it should append it to this list.
- **C1 header Sign in and "For cafes and regulars" (step 3).** Both are in `design/customer/Home.dc.html` and left out until the accounts and recurring-order steps. The C2 header Sign in is left out for the same reason.
- **Checkout: accounts and online payment (step 5).**
  - Left out of C5: the guest "Have an account? Sign in" row and signed-in prefill (`CheckoutSignedIn.dc.html`).
  - Left out of C7: the "Save your details for next time" offer (AC-C10).
  - Left out of the email: the guest "Create an account" box (AC-C11).
  - These belong to the accounts step.
  - "Pay online now" is behind the server-only switch `ONLINE_PAYMENTS_ENABLED` (off). `POST /api/orders` refuses `online` with 422 `payment_method_unavailable` whatever the switch says, until the payment-provider step.
- ~~**Phone display formatting.**~~ Resolved 30 Sep 2026 (step 2): `formatPhone` in `src/shared/utils/phone.ts` ("0491 570 156", "03 7010 2140"; landlines changed from "(03) 7010 2140" on 1 Oct 2026 to match spec section 4's branch table and the designs), used by OrderRow. Later screens that show a phone should use it too.

- **Shared patterns not built yet (step 2).** These repeat across screens but belong with their features: the admin side panel (A3 order detail, A5 product form), admin nav, admin filter buttons with a pressed ink fill (A2/A4), empty-state boxes, admin uppercase section headings and the order-detail items table. ProductCard photos will need `images.remotePatterns` for Firebase Storage once uploads exist. Built in step 3: the link styled as a Button (`atoms/ButtonLink`) and the sticky bottom bar (`organisms/BottomBar`, used by C1, the C2 order bar and the C4 total bar).

## Investigated but unreproduced bugs

_None yet._

## Un-applied migration scripts

_None yet._

## Data model notes

- **Deviations from spec section 5 (by design):** money is stored as integer cents (`priceCents`, `totalCents`, …), not decimals. Order items and recurring-order items/skips are embedded arrays, so `OrderItem.id` / `order_id` don't exist. Email uniqueness is enforced with `customerEmails` / `staffEmails` lock docs.
- **Fruit loaf is Northcote-only in the seed.** No design has a branch-only product, so the seed also switches Fruit loaf off at Brunswick. The admin Products canvas shows "At 2 of 3 branches · not Fitzroy" for it.
- **Seed sold-out dates follow the real clock.** They're set to each branch's earliest (and second) pickup date at seed time. A rerun on a later day moves them forward, and the designs' fixed dates (sold out Wed 30 Sep) won't match literally. Seeding before the 2pm cutoff and testing after it puts the "first" sold-out date on a day that can no longer be ordered. That happened in step 4: Fitzroy's Cinnamon scroll was sold out for Sun 4 Oct. To QA the C4 warning, rerun `bun run seed` on the day.
- **All seeded branches close on Mondays.** The "new branch is closed on the cart's day" path in C4 can't be reached with the seed as is. Step 4 tested it by giving Fitzroy a second closed day on the emulator for one run, then putting it back.
- **Additions in step 3 (not in spec section 5).**
  - `Branch.displayOrder` (Northcote 1, Fitzroy 2, Brunswick 3): C1 lists the branches in that order, which is neither A–Z nor doc-ID order.
  - `settings/catalog` `{ categoryOrder }`: see Deferred features.
  - The client-side cart (`localStorage`, key `millstone:cart:guest`; later `millstone:cart:{customerId}`) stores each line's product **name** but never a price. The name is only for "We took X out" messages after a branch switch, when the new branch's menu no longer has the product. The cart also records the branch and date it was last checked against (`checkedAgainst`), so a branch switch is still recognised after a reload.

- **Orders placed at checkout (step 5).**
  - The order's doc ID is the browser's checkout key (a v4 UUID). A retry with the same key returns the first order (200) and sends no second email.
  - The key stays the same after the customer edits the cart and comes back. So if a request timed out but was saved, the retry returns the saved order, not the edited cart. That's deliberate: it shows what was really placed rather than making a second order.
  - Every order transaction reads and writes `counters/orders`, so placing orders is serialised. That's fine at a bakery's volume.
- **Test orders on the emulator (3 Oct 2026).** Batch A's API checks left orders MS-1001 to MS-1005 and guest customers `ben.okafor@example.com` and `tap.twice@example.com` on the emulator. `bun run seed --reset` clears them.

## Privacy and security notes

- **C7 is reachable by anyone with its link (step 5).**
  - `/orders/{orderId}` and `GET /api/orders/{orderId}` need no session: the unguessable order ID is the only credential.
  - They show the first name, the contact email, items, total, branch and pickup day. They never show the phone, notes or full name.
  - The ID can still leak through browser history, a shared screenshot of the URL, or a forwarded link, and it never expires.
  - Later: expire the page some days after pickup, or limit it to the placing browser session and the customer's account.
- **Any checkout links the order to whoever owns that email (step 5).** A guest who types an existing customer's email adds the order to that customer's record and history. That includes a customer with a password. The customer's own details are never changed. This is spec 5's "guest = customer with no password" model.

## Known UX gaps

- **Design-system inconsistencies found while building the components (step 2).**
  - The A5 product form (`design/admin/Products.dc.html`) has a **delft** info note, but `design/system/README.md` keeps delft for Recurring and focus only. **Decided 30 Sep 2026: the README wins.** `Notice tone="info"` uses the plain style of the A5 price-change note (flour ground, line-strong edge); no notice uses delft. The products step should build the "New products go on the menu…" note with this tone, not the blue in the canvas.
  - The customer's sticky bottom bar shadow (`0 -2px 0 …, 0 -6px 16px …`, from the C1/C2 design files) isn't in `tokens.json`. It's added as `--shadow-bar` in `globals.css`. A `branch-name` type style (Bitter 600 20/26, as on C1 and C2) is added the same way.
  - `bundle.css` has two literal colours outside the tokens: the Ready button hover `#2f5530` (added as `--color-sage-deep` in `globals.css`, not in `tokens.json`) and an error-field background `#fffaf8` (dropped; error fields keep `flour-raised` with the brick edge).
  - ChoiceGroup has no error state in `index.d.ts`, but the checkout errors screen shows "Choose how you'd like to pay." under it. The component takes an extra `error` prop so it's announced with the group.
  - The month grid starts the week on Sunday (as in the design bundle) while WeekdayPicker starts on Monday (as its README says). Left as designed.
  - On a 390px phone the month grid's day cells are 48px high but about 44px wide: seven 48px columns don't fit. The strip (the customer's main picker) is unaffected. Only C11's start/end dates use the month grid on a phone.
  - OrderRow's "Details" link is 64px high (the admin tap size), not the 48px in the design bundle.
  - ProductCard lets the price and the stepper wrap onto two lines on a narrow two-column card, so the stepper buttons stay 48px wide. In the design bundle they shrink instead. The C2 menu grid uses `footer="stacked"` instead (3 Oct 2026, as in `Menu.dc.html`'s `.ms-card-foot` overrides): the price on its own line, and Add or the stepper across the card. The default inline footer stays as the design system shows it, and the cart's row layout uses it.
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
- **Cart (step 4): decisions and deliberate differences from the designs.**
  - **The change-branch warning also lists items sold out at the new branch** on the day the cart would move to (decided 3 Oct 2026). `CartBranchWarning.dc.html` only lists items the branch doesn't make. AC-C2 and "nothing changes until confirmed" mean a sold-out item shouldn't vanish without a warning. The dialog adds a second sentence and list for these.
  - **Undesigned copy.**
    - The warning's sold-out line: "This is sold out at Fitzroy for Tue 6 Oct, so we'll take it out too:".
    - The new branch closed on the cart's day: "Fitzroy is closed on Tue 6 Oct, so your pickup is now Wed 7 Oct." (A passed cutoff reuses step 3's "Orders for … have closed…".)
    - The sheet while it checks the new branch ("Checking Fitzroy…") and when that fails ("We couldn't check the Fitzroy menu…").
    - C4 loading and failure: "Loading your order…", "Checking prices for Wed 7 Oct…" and "We couldn't load your order's prices…" with Try again.
    - No cart at all, or its branch is gone: "Your order is empty", "Choose a branch to start an order." and "See our branches".
    - The C5 placeholder page (`/checkout`).
  - **The shared site header stays above C4.** The design has only the "Menu" back link in the header. Here it sits at the top of the content, under the wordmark, and the title sits lower than in the canvas.
  - **Lines are in menu order** (category order, then A–Z), not the canvas's catalogue order.
  - **Focus after a change.**
    - A removed line moves focus to the next line's name (else the previous, else "Your order is empty").
    - A confirmed branch change that removed items or moved the day focuses the notices.
    - A quiet branch change leaves focus on the branch Change button.
  - **Notices belong to one screen.** Cart messages are scoped per screen and branch (`cartMessageScope.menu/cart`), so C4's "We took … out" doesn't show again on C2 after "Add more items", and C2's notices don't repeat on C4.
  - **Stale prices.**
    - While C4's prices reload, the lines stay visible but `inert`, and the total bar is hidden.
    - If the reload fails, the old prices are dropped and only the error with Try again shows. TanStack keeps placeholder data only while a query is pending.
    - The same applies to C2.
  - **Totals on C4 are for display.** They come from the latest menu prices. The order total is calculated on the server in C5 (AC-C8).
  - **At 1180px the C4 total bar is 640px wide**, like the C2 order bar.
- **Confirmation email (C13, step 5): decisions and deliberate differences.**
  - The pay-at-pickup preview text is AC-C11's "Pay $20.70 when you collect.". `Email.dc.html` starts it with "Pickup at Northcote. " as well.
  - "Ready from 7am" (spec 13) isn't in the C7 or C13 canvases. It joins the intro: "We'll have it ready at Northcote from 7am on Tue 6 Oct." C7 will use the same sentence.
  - Order notes aren't in the email (nor in the C7 design).
  - "Get directions" opens a Google Maps search for the branch address.
  - The email's colours are read from `tokens.json` (`emailTheme.ts`), because email clients ignore CSS variables.
- **A Firestore outage takes about 10s to show on a fresh page load.** Every Firestore read has a 5s deadline (`firestoreRead`), so the API answers 503 `unavailable` in about 5s. On a full page load, the server prefetch waits its 5s first, then the browser asks once more (a 503 `unavailable` isn't retried), and only then does the error notice show. Sending the server's failure to the browser (dehydrating the failed query) would halve this. Not done, since it only affects an outage.
- **The first server render can't see the cart.** The server prefetches the URL's date (or the earliest). Internal links always carry the cart's date, so this only matters for a hand-typed `/menu/{branch}` URL: the browser then moves to the cart's date and fetches that menu.
- **Server prefetch bypasses Axios.** Pages prefetch through the same service functions the API routes use (`getBranchesResponse`, `getBranchMenu`) into TanStack Query. Every fetch in the browser goes through Axios and the `/api` routes.
- **Wrong weekday in design-system docs.** `design/system/README.md` ("Pickup Tue 30 Sep at Northcote"), the `admin-title` sample in `tokens.json` ("Today · Tue 30 Sep") and the ProductCard docs ("Sold out for Tue 30 Sep") say Tuesday. 30 Sep 2026 is a Wednesday. The code always derives weekday names from the date.

## Tooling and housekeeping

- ~~**`/dev/tokens` is publicly reachable.**~~ Resolved 30 Sep 2026 (step 2): every `/dev/*` page (`/dev/tokens`, `/dev/components`) is gated by `src/app/dev/layout.tsx` and returns 404 in production builds. Setting the server-only env var `DEV_PAGES=true` for both `bun run build` and `bun run start` turns them back on, for QA against a production build (`/dev/components` is rendered per request, so it needs the variable at start as well).
- **ESLint held at 9, TypeScript held at 6.0.** `eslint-plugin-react` (via `eslint-config-next`) doesn't support ESLint 10 yet, and `typescript-eslint` needs TypeScript below 6.1. Upgrade once they catch up.
- ~~**Node 21.1.0 locally.**~~ Resolved 30 Sep 2026: Node 24.21.0 (LTS) installed via nvm. Build, lint and `bun test` pass on it. nvm's default alias still points at v21.1.0, so new non-interactive shells pick 21 until `nvm alias default 24` is run.
- **Stray `~/package-lock.json`** outside the repo made Next guess the wrong workspace root. `turbopack.root` is pinned in `next.config.mjs` to work around it.
- **`next-env.d.ts` is tracked** even though `.gitignore` lists it; Next regenerates it on every build.
