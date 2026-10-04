# Known issues and open items

Maintained by Claude Code. The spec (`millstone-spec.md`) stays the source of truth; this file tracks loose ends.

## Undeployed infra steps

- **No real Firebase project yet.** Local dev runs on the emulator (`demo-millstone`). Before deploying: create the Blaze project, run `firebase deploy --only firestore:rules,firestore:indexes,storage`, and set `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` in the host's env.
- **Emulator needs a JDK (21+)** installed locally (`brew install --cask temurin@21`).
- **`POST /api/orders` has no rate limiting (step 5).** It's public (guest checkout) and has no abuse protection. A script could place unlimited fake pay-at-pickup orders, create guest customers, and send confirmation emails to any address. Before launch, add rate limiting per IP (and per email), at the host's edge or in the route. Consider a bot check too.
- **No email provider (step 5).** Emails go through `sendEmail` (`src/shared/lib/email/`). In development, and in builds with `DEV_PAGES=true`, each one is saved to the gitignored `.dev-emails/` folder, logged to the console, and listed at `/dev/emails`. Anywhere else it is logged as unsent (warn) and nobody receives it. A provider and a sender address are needed before launch.
- **Emulator data is kept between runs (3 Oct 2026).** `bun run emulators` imports from the gitignored `.emulator-data/` on start and exports to it on exit. The export only happens on a clean stop (one Ctrl-C, then wait for "Export complete"); a second Ctrl-C or a killed terminal skips it and loses that session's changes. The first run with an empty folder logs "Could not find import/export metadata file, skipping data import!", which is expected. `bun run seed` still works on top (it's idempotent, and `--reset` still wipes). For a clean start, stop the emulator and delete `.emulator-data/`.

- **Auth env on the host (step 6).** `AUTH_SECRET` must be set wherever the app runs; without it Auth.js refuses every sign-in (the API answers 500). `AUTH_TRUST_HOST=true` is needed for `next start` and any self-hosted deploy. Set `AUTH_URL` too if the host can't work out its own URL. Production also serves the cookie as `__Secure-authjs.session-token` over HTTPS.
- **Sign-in has no IP rate limit (step 6).** Repeated guessing is slowed per email only: 5 failures in 15 minutes lock that email for 15 minutes, counted in `signInThrottle/{sha256(email)}`. Left for later: per-IP or edge rate limiting, a bot check, and pruning old throttle docs (each is deleted on a successful sign-in; failures for unknown emails stay). Someone who knows a staff email can keep that person locked out by guessing wrong every 15 minutes.

## Deferred features

- ~~**Admin free-text search (AC-A3).**~~ Resolved 4 Oct 2026 (step 6, Batch B): orders store `searchTokens` (see Data model notes), searched with `array-contains` plus two composite indexes.
- ~~**Category display order.**~~ Resolved 1 Oct 2026 (step 3): `settings/catalog` holds `categoryOrder` (seeded Breads, Pastries, Bagels). Categories not listed go last, A–Z. When A5 lets the owner type a new category, it should append it to this list.
- **C1 header Sign in and "For cafes and regulars" (step 3).** Both are in `design/customer/Home.dc.html` and left out until the accounts and recurring-order steps. The C2 header Sign in is left out for the same reason.
- **Checkout: accounts and online payment (step 5).**
  - Left out of C5: the guest "Have an account? Sign in" row and signed-in prefill (`CheckoutSignedIn.dc.html`).
  - Left out of C7: the "Save your details for next time" offer (AC-C10).
  - Left out of the email: the guest "Create an account" box (AC-C11).
  - These belong to the accounts step.
  - "Pay online now" is behind the server-only switch `ONLINE_PAYMENTS_ENABLED` (off). `POST /api/orders` refuses `online` with 422 `payment_method_unavailable` whatever the switch says, until the payment-provider step.
- **Staff accounts (step 6).** Staff can't reset or change a password, and the owner has no screen to add, remove or move staff. Passwords come from the seed (`SEED_STAFF_PASSWORD`). A1 says "Forgotten your password? Ask the owner to reset it."
- **No audit trail of who did what (step 6).** Orders record when they changed, not which staff member changed them.
- **`awaiting_payment` orders never expire yet (step 6, Batch B).** Spec 6 says they expire after about an hour. There's no job for it until the payment-provider step. The seed's MS-1028 stays `awaiting_payment`; staff never see it either way.
- ~~**Phone display formatting.**~~ Resolved 30 Sep 2026 (step 2): `formatPhone` in `src/shared/utils/phone.ts` ("0491 570 156", "03 7010 2140"; landlines changed from "(03) 7010 2140" on 1 Oct 2026 to match spec section 4's branch table and the designs), used by OrderRow. Later screens that show a phone should use it too.

- **Shared patterns not built yet (step 2).** These repeat across screens but belong with their features: ~~the admin side panel (A3 order detail, A5 product form)~~, admin nav, ~~admin filter buttons with a pressed ink fill (A2/A4)~~, empty-state boxes, ~~admin uppercase section headings~~ and the order-detail items table. Step 6 Batch B built `organisms/SidePanel`, `molecules/FilterButtons` and `atoms/SectionLabel` for A5 and A4 to reuse; the items table stays inside A3. ProductCard photos will need `images.remotePatterns` for Firebase Storage once uploads exist. Built in step 3: the link styled as a Button (`atoms/ButtonLink`) and the sticky bottom bar (`organisms/BottomBar`, used by C1, the C2 order bar and the C4 total bar).

## Investigated but unreproduced bugs

_None yet._

## Un-applied migration scripts

- **`bun run migrate:orders`** (`scripts/migrations/2026-10-order-admin-fields.ts`, step 6 Batch B). Adds `searchTokens`, `cancellationNote` and `collectUndo` to orders saved before them. It also turns a free-text `cancellationReason` into a code: "Not collected" and "Customer request" map to their codes, and anything else becomes `other` with the old text as its note. The order schema requires these fields, so older orders fail to load until it has run. It's idempotent and has the seed's safety rules (the emulator, or `--project=<id>`). Applied to the local emulator on 4 Oct 2026; run it against any real project before this code is deployed, together with `firebase deploy --only firestore:indexes` for the new search and list indexes.

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
  - The order's doc ID is the browser's checkout key (a v4 UUID). A retry with the same key and the same order returns the first order (200) and sends no second email. "Same" means the branch, pickup date, payment method, and items with their quantities. Contact details and notes don't count.
  - **A key reused for a different order** is refused with 409 `checkout_key_mismatch`, carrying the existing order's ID and number, and nothing is saved. This happens when an order went through but its response was lost, and the customer then edited the cart. C5 says that order (MS-XXXX) was already placed, links to its confirmation, and offers to place the current cart as a new order with a fresh key.
  - Every order transaction reads and writes `counters/orders`, so placing orders is serialised. That's fine at a bakery's volume.
- **Admin fields on orders (step 6, Batch B).**
  - `searchTokens: string[]`: order number digits and `ms` + digits; every name word's prefixes from 2 letters; phone suffixes from 3 digits and prefixes from 4. Written by `orderToDoc`, so every writer keeps it up to date; never read back into `Order`. A query ("MS-1042", "0491 570 156", "+61…", "priya nair") becomes the same tokens. Firestore matches the longest, and the server checks the rest. Searches return at most 100 orders, newest pickup date first. Staff search only their own branch.
  - `cancellationReason` is now a code (`not_collected` | `customer_request` | `other`), not free text. `cancellationNote` holds staff's words for `other` (200 characters at most). The words shown come from content.
  - `collectUndo: { previousStatus, until } | null`: set by a one-tap Collected on a paid order. The browser shows Undo for 5s; the server accepts it for 10s after the collect is saved, to allow for two slow round trips. After that the order is final (spec 7). Collected through "Yes, paid · Collected" has no Undo.
  - Every action sends the status the staff member saw. If the order has moved on, the answer is 409 `order_changed` with the order's status now, and nothing is written (`not_allowed` when the order's state never allows the action). The admin says "MS-1042 was already changed on another screen. It's now Ready." and refetches.
- **Seed orders (step 6, Batch B).**
  - The admin canvases' orders, MS-1029 to MS-1046, plus MS-1027 (`expired`) and MS-1028 (`awaiting_payment`) to show they stay hidden. Doc IDs are `seed-ms-NNNN`. MS-1042 is generated from `recurringOrders/seed-corner-cup` with the ID `seed-corner-cup_{date}`.
  - Days follow the clock per branch: D0 is today, or the next open day; then the two open days after it, and the open day before. Times are fixed Melbourne times on those days, so a rerun on the same day changes nothing, and a rerun puts every seed order back to its seeded state. A seed run before about 8:30am gives some of D0's ready/collected times in the future. Seeding on a closed day (Monday, for every seeded branch) puts D0 on the next open day, so some history times are in the future too (e.g. MS-1037 cancelled 8:30am Tue and refunded earlier). Seed data only; left as is.
  - The seed raises `counters/orders.next` to at least 1047, and refuses to run if a non-seed order holds a number from 1027 to 1046 (`bun run seed --reset` clears that). A generated MS-1042 from an earlier day's run is deleted.
  - The seed's guests (Priya Nair, Tom Walsh and others) are customers without passwords, as checkout creates them. Corner Cup Cafe has an account, since a recurring order needs one. Names, phones and the `cornercup.example.com`-style emails are from the canvases.
- **Test orders on the emulator (3 Oct 2026).** Step 5's API checks left orders MS-1001 to MS-1005 and guest customers `ben.okafor@example.com` and `tap.twice@example.com` on the emulator. Step 6's Batch A checks added two "Test Batch A" pay-at-pickup orders (one at Fitzroy, one at Northcote) and the guest `batch.a@example.com`. `bun run seed --reset` clears them.
- **Batch B QA orders (4 Oct 2026).** The emulator had no orders when Batch B started. QA placed MS-1047 to MS-1050 through checkout (guest `ben.okafor@example.com`) and then deleted them, so the counter is at 1052. The guest record stays.

## Privacy and security notes

- **C7 is reachable by anyone with its link (step 5).**
  - `/orders/{orderId}` and `GET /api/orders/{orderId}` need no session: the unguessable order ID is the only credential.
  - They show the first name, the contact email, items, total, branch and pickup day. They never show the phone, notes or full name.
  - The ID can still leak through browser history, a shared screenshot of the URL, or a forwarded link, and it never expires.
  - Later: expire the page some days after pickup, or limit it to the placing browser session and the customer's account.
- **C5 keeps what's typed in sessionStorage (step 5).** The key is `millstone:checkout:guest`, holding name, mobile, email, notes, payment choice and the checkout key. It lets the details survive a trip to C4 and back. Personal details stay in that tab's storage until the order is placed or the tab is closed.
- **Any checkout links the order to whoever owns that email (step 5).** A guest who types an existing customer's email adds the order to that customer's record and history. That includes a customer with a password. The customer's own details are never changed. This is spec 5's "guest = customer with no password" model.

- **Staff sessions (step 6).**
  - A session lasts 12 hours from sign-in and doesn't slide: one sign-in per shift, and a tablet left on overnight asks again the next morning (`sessionPolicy.ts`).
  - Every admin API re-reads `staffUsers/{id}`, so removing someone or moving them to another branch applies on their next request, not when the token expires. Pages do the same through the `(staff)` layout.
  - The session token is a JWT. Signing out clears that browser's cookie only; there's no server-side list of sessions to revoke.
  - Customer sessions don't exist yet. The session's `principal` has a `kind`, and every staff check refuses anything that isn't `kind: "staff"` (403). The accounts step adds `kind: "customer"`.
- **Auth.js is a beta (`next-auth@5.0.0-beta.32`, step 6).**
  - Under `next dev`, server-side `signIn()` returns the error page URL for a wrong password instead of throwing. With no `AUTH_SECRET` it returns its own callback URL. `signInStaff` handles both: a sign-in only counts when Auth.js redirects to the page that was asked for.
  - The `/api/auth/[...nextauth]` catch-all isn't mounted, so Auth.js's built-in pages and endpoints aren't reachable. Sign-in and sign-out go through `/api/admin/sign-in` and `/api/admin/sign-out`.
- **Another branch's order is a 404 for staff (step 6),** the same answer as a missing order, so a guessed ID can't confirm an order exists. Owner-only APIs answer 403. Staff asking the list for another branch get 403 (branch IDs are public).

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
    - ~~The C5 placeholder page (`/checkout`).~~ Replaced by C5 in step 5.
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
- **Checkout (C5) and confirmation (C7), step 5: decisions and deliberate differences.**
  - **Payment.** With online payment switched off, the ChoiceGroup shows only "Pay at pickup", already chosen (decided 3 Oct 2026). The ChoiceGroup README asks for two to four options. With the switch on, both show, nothing is chosen, and the design's "Choose how you'd like to pay." error applies. So an empty submit says "Fix the 3 things marked above.", not the 4 in `CheckoutErrors.dc.html`.
  - **Header.** The shared site header stays above C5 and C7, as on C4. C5's "Your order" back link sits under it. C7's design has only the wordmark.
  - **C7 "Need to change or cancel?"** is the email's bordered box, as asked, not the design's single line in the Pickup card. The phone is a `tel:` link styled like other links.
  - **C7 styling.**
    - The Pickup card keeps Card's quiet shadow; the canvas has a border only. `cx` doesn't merge classes, so a `shadow-none` override wouldn't reliably win.
    - The order number uses the `admin-order-number` type style, which has the same values as the canvas (32/36 bold, 0.02em). The tokens have no customer equivalent.
  - **What the server says after Place order.**
    - A day that can't be ordered moves the cart to the server's earliest day.
    - Unavailable items come out of the cart.
    - Both go back to C4 with the existing messages: "Orders for … have closed…", "… is sold out for …, so we took it out…", "… no longer on the … menu".
    - A day before the new earliest counts as past its cutoff even if the branch has just closed that day (`pickupDateProblem`'s rule), so it gets the "have closed" sentence.
    - A changed price, a failed request and a reused checkout key stay on C5 as a notice, which takes focus.
  - **Focus.**
    - An invalid submit focuses the first field with an error.
    - C7 focuses "Your order is in" when it opens.
    - Notices C4 left showing are cleared when C5 opens. Only what changes from there sends the customer back.
  - **Undesigned copy.**
    - "Placing your order…" and "Your order is placed. Opening your confirmation…"
    - The price-changed, failed ("We couldn't place your order") and reused-key ("Your earlier order MS-… was already placed") notices.
    - The name and notes length errors.
    - C5 loading. C7 loading, load error and not-found.
    - The `/dev/emails` pages.
- **Confirmation email (C13, step 5): decisions and deliberate differences.**
  - "Ready from 7am" (spec 13) isn't in the C7 or C13 canvases. It joins the intro: "We'll have it ready at Northcote from 7am on Tue 6 Oct." C7 will use the same sentence.
  - Order notes aren't in the email (nor in the C7 design).
  - "Get directions" opens a Google Maps search for the branch address.
  - The email's colours are read from `tokens.json` (`emailTheme.ts`), because email clients ignore CSS variables.
- **A Firestore outage takes about 10s to show on a fresh page load.** Every Firestore read has a 5s deadline (`firestoreRead`), so the API answers 503 `unavailable` in about 5s. On a full page load, the server prefetch waits its 5s first, then the browser asks once more (a 503 `unavailable` isn't retried), and only then does the error notice show. Sending the server's failure to the browser (dehydrating the failed query) would halve this. Not done, since it only affects an outage.
- **The first server render can't see the cart.** The server prefetches the URL's date (or the earliest). Internal links always carry the cart's date, so this only matters for a hand-typed `/menu/{branch}` URL: the browser then moves to the cart's date and fetches that menu.
- **Server prefetch bypasses Axios.** Pages prefetch through the same service functions the API routes use (`getBranchesResponse`, `getBranchMenu`) into TanStack Query. Every fetch in the browser goes through Axios and the `/api` routes.
- **Wrong weekday in design-system docs.** `design/system/README.md` ("Pickup Tue 30 Sep at Northcote"), the `admin-title` sample in `tokens.json` ("Today · Tue 30 Sep") and the ProductCard docs ("Sold out for Tue 30 Sep") say Tuesday. 30 Sep 2026 is a Wednesday. The code always derives weekday names from the date.

- **Admin shell (step 6): decisions and deliberate differences.**
  - **A1 wasn't designed** (spec 13). It's C8's sign-in at admin size in a 560px column: no "Create an account", "Forgot your password?" button or "Continue as a guest". Undesigned copy: the intro "Sign in with your staff email to see your branch's orders.", "Forgotten your password? Ask the owner to reset it.", the lock message "Too many tries. Wait 15 minutes and try again, or ask the owner." and "We couldn't sign you in just now…". The C8 refusal drops "or reset your password".
  - **Staff opening `/admin/products` by URL** see "This page is for the owner" with "Back to orders" (status 200). The real guard is the owner-only API.
  - **The A1 wordmark links to `/admin`**, which sends anyone signed out straight back to A1.
  - **When a session ends mid-service,** the tablet goes to A1 and back to the same URL. Anything typed in an open dialog (a cancel reason, for example) is lost.
  - "We couldn't sign you out…" under the header is undesigned.

- **A2 order list and A3 panel (step 6, Batch B): decisions and deliberate differences.**
  - **Collected and Cancelled on All dates reach back 14 days** (pickup dates from 13 days ago on; decided 4 Oct 2026). The summary says "… in the last 2 weeks" (undesigned). A chosen date and search reach any order.
  - **Collected on a paid order in the panel closes the panel** and moves focus to Undo (decided 4 Oct 2026). The panel is modal, so the design's Undo message would sit behind it.
  - **The last message also shows in the panel** while it's open ("MS-1046 cancelled. Refund it…", errors), because the status line is behind it. Opening an order clears the previous message.
  - **Focus after each action:**
    - Ready → that row's Collected.
    - Paid Collected → Undo.
    - Undo → the row's Collected.
    - Undo running out while focused → the status line.
    - Payment dialog → the status line (row) or the panel's message (panel).
    - Cancel and Mark refunded → the panel's message.
  - **Rows someone is touching stay put.** Rows are sorted by date, branch, then number, so a refresh never moves one and new orders land at the end of their group. A row with focus in it, or open in the panel, stays in its slot when a refresh (or another screen's change) takes it off the list. Its data comes from its own detail, until focus moves elsewhere or the panel closes.
  - **"MS-1047 just came in"** names orders placed since the last refresh that this screen hasn't seen under the same filters. It shows until a refresh brings none. Up to three numbers, then "N new orders just came in" (undesigned). Only this part is an `aria-live` region; "Updated 9:41am" isn't, so a screen reader doesn't announce every refresh.
  - **The list refreshes every 30s**, also while the tab is in the background. Each refresh is one list query plus four `count()` queries for the status buttons; the open order refreshes with it.
  - **History is in time order**, so a pay-at-pickup order reads Placed, Ready, Paid, Collected. The canvas lists a fixed order (Placed, Paid, Ready…).
  - **The page scrolls as a whole**; the canvas scrolls only the list under a fixed filter band. The panel is a native modal `<dialog>` under the 80px header, which sticks to the top of the viewport on every signed-in admin page.
  - **The cancel dialog's main button** reads "Choose a reason first" / "Say what happened first" and looks unavailable, as designed. It stays focusable (`aria-disabled`), and a tap shows the error under the field.
  - **A screen-reader-only "Orders" `<h1>`.** The canvas has no visible page title.
  - **Undesigned copy:**
    - "MS-1042 was already changed on another screen. It's now Ready. The list is up to date."
    - "Too late to undo. MS-1043 stays collected."
    - "That didn't go through…", "The orders didn't answer in time…"
    - "Couldn't refresh since 9:41am…"
    - "Showing the latest 100…"
    - "Loading orders…", "We couldn't load the orders…", "Loading the order…", "This order isn't on your list…"
    - The cancel form's field errors.
  - **The 409s are logged by the browser** as failed requests in the console. That's expected for a refused action; the app itself logs them as warnings.

- **A4 branch availability (step 7, Batch A): decisions and deliberate differences.**
  - **Orders that already include the product (decided 5 Oct 2026).** The change saves at once, as on the canvas. If open orders (Placed or Ready) already include the product, the message turns wheat and names them.
    - Sold out for a day counts that day's orders. Switching off counts every order from today on.
    - It names the first 5 numbers, then "and N more".
    - Those orders never change: they keep their items and prices. Awaiting-payment orders aren't counted, since staff never see them.
    - If that check fails, the change still stands and the message says the orders couldn't be checked.
  - **One sold-out day per product, per branch** (spec 5's single `sold_out_on`). As on the canvas, a product sold out for one day only offers "Back on sale"; it has to go back on sale before it's marked for another day.
    - Switching a product off keeps its sold-out date, so switching it back on the same day still shows it.
    - A sold-out date stops showing from that day itself (Melbourne midnight), as on the canvas (`> TODAY`). By then that day can't be ordered anyway.
  - **Writing a row creates it**, and a row that ends up back at the default (on, not sold out) is kept rather than deleted. It reads the same as a missing row.
  - **The status line sticks under the admin header** (A2's doesn't). On the canvas it sits in a fixed band above a scrolling list. Without it, a warning about a row far down the list would be out of view. Pages with it get 200px of scroll padding.
  - **The picker shows 7 days from the earliest**, with closed days struck through. Marking a day that can no longer be ordered is a 422 with the earliest date.
  - **The owner's branch and the chosen day live in the URL** (`?branch=&date=`), as A2's filters do.
    - The owner starts on the first branch in C1's order.
    - An unknown branch in the URL redirects to the default.
    - A day the picker can't mark falls back to the earliest.
  - **The list refreshes every 60s.** A tap on a row changed elsewhere since gets a 409 (`availability_changed`, carrying the row now), and the row updates.
  - **The customer menu is fresh on every load.** The API is `no-store` and C2 renders per request. In an open tab, TanStack keeps a menu for 60s and refetches on focus (decided 5 Oct 2026: kept). Checkout rechecks on the server anyway.
  - **The messages mention recurring orders** ("Recurring orders will leave it out…"), as on the canvas. Generating recurring orders isn't built yet.
  - **Undesigned copy:**
    - The picker note after the cutoff ("…because orders closed at 2pm today") and when tomorrow is closed ("Earliest pickup is Wed 7 Oct.").
    - The orders lines: "3 orders for Tue 6 Oct already have it: MS-1040, MS-1042 and MS-1044. Those orders stay as placed, so call the customers if you can't make it." and "… still to collect already have it …".
    - "We couldn't check for orders that already have it. Look on Orders before the day."
    - "… was already changed on another screen. It's now off the menu. The list is up to date."
    - "… was hidden on another screen, so it's no longer on this list."
    - "Orders for … have closed, so nothing can be marked sold out for it. The earliest is now …".
    - "The menu didn't answer in time…", "That didn't go through…".
    - Loading and failure: "Loading the menu…", "Loading Fitzroy…", "Fitzroy didn't load.", "We couldn't load this branch's menu…".
    - "There are no products on the menus yet."

## Tooling and housekeeping

- ~~**`/dev/tokens` is publicly reachable.**~~ Resolved 30 Sep 2026 (step 2): every `/dev/*` page (`/dev/tokens`, `/dev/components`) is gated by `src/app/dev/layout.tsx` and returns 404 in production builds. Setting the server-only env var `DEV_PAGES=true` for both `bun run build` and `bun run start` turns them back on, for QA against a production build (`/dev/components` is rendered per request, so it needs the variable at start as well).
- **ESLint held at 9, TypeScript held at 6.0.** `eslint-plugin-react` (via `eslint-config-next`) doesn't support ESLint 10 yet, and `typescript-eslint` needs TypeScript below 6.1. Upgrade once they catch up.
- ~~**Node 21.1.0 locally.**~~ Resolved 30 Sep 2026: Node 24.21.0 (LTS) installed via nvm. Build, lint and `bun test` pass on it. nvm's default alias still points at v21.1.0, so new non-interactive shells pick 21 until `nvm alias default 24` is run.
- **Stray `~/package-lock.json`** outside the repo made Next guess the wrong workspace root. `turbopack.root` is pinned in `next.config.mjs` to work around it.
- **`next-env.d.ts` is tracked** even though `.gitignore` lists it; Next regenerates it on every build.
