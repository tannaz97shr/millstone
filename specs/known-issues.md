# Known issues and open items

Maintained by Claude Code. The spec (`millstone-spec.md`) stays the source of truth; this file tracks loose ends.

## Undeployed infra steps

- **No real Firebase project yet.** Local dev runs on the emulator (`demo-millstone`). Before deploying: create the Blaze project, run `firebase deploy --only firestore:rules,firestore:indexes,storage`, and set `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` in the host's env.
- **Emulator needs a JDK (21+)** installed locally (`brew install --cask temurin@21`).

## Deferred features

- **Admin free-text search (AC-A3).** Firestore can't do substring search on name or phone. The admin step needs a lowercased search field (or prefix tokens) on orders, plus an index for it.
- **Category display order.** Products store `category` as a free-text name ("Breads"). Nothing yet says Breads → Pastries → Bagels. The menu step needs an order (e.g. a small categories config or a `sortOrder` field).
- **Phone display formatting.** Phones are stored as digits (`0491570156`, `0370102140`). A formatter for "0491 570 156" / "(03) 7010 2140" belongs with the first UI that shows them.

## Investigated but unreproduced bugs

_None yet._

## Un-applied migration scripts

_None yet._

## Data model notes

- **Deviations from spec section 5 (by design):** money is stored as integer cents (`priceCents`, `totalCents`, …), not decimals. Order items and recurring-order items/skips are embedded arrays, so `OrderItem.id` / `order_id` don't exist. Email uniqueness is enforced with `customerEmails` / `staffEmails` lock docs.
- **Fruit loaf is Northcote-only in the seed.** No design has a branch-only product, so the seed also switches Fruit loaf off at Brunswick. The admin Products canvas shows "At 2 of 3 branches · not Fitzroy" for it.
- **Seed sold-out dates follow the real clock.** They're set to each branch's earliest (and second) pickup date at seed time. A rerun on a later day moves them forward, and the designs' fixed dates (sold out Wed 30 Sep) won't match literally.

## Known UX gaps

- **Wrong weekday in design-system docs.** `design/system/README.md` ("Pickup Tue 30 Sep at Northcote"), the `admin-title` sample in `tokens.json` ("Today · Tue 30 Sep") and the ProductCard docs ("Sold out for Tue 30 Sep") say Tuesday. 30 Sep 2026 is a Wednesday. The code always derives weekday names from the date.

## Tooling and housekeeping

- **`/dev/tokens` is publicly reachable.** Remove it or gate it to development before launch.
- **ESLint held at 9, TypeScript held at 6.0.** `eslint-plugin-react` (via `eslint-config-next`) doesn't support ESLint 10 yet, and `typescript-eslint` needs TypeScript below 6.1. Upgrade once they catch up.
- ~~**Node 21.1.0 locally.**~~ Resolved 30 Sep 2026: Node 24.21.0 (LTS) installed via nvm. Build, lint and `bun test` pass on it. nvm's default alias still points at v21.1.0, so new non-interactive shells pick 21 until `nvm alias default 24` is run.
- **Stray `~/package-lock.json`** outside the repo made Next guess the wrong workspace root. `turbopack.root` is pinned in `next.config.mjs` to work around it.
- **`next-env.d.ts` is tracked** even though `.gitignore` lists it; Next regenerates it on every build.
