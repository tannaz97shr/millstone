# Millstone

Original bakery ordering website: 3 branches, pickup only, pay online or at pickup,
recurring orders for cafes, and a simple admin order list for staff at the counter.
Portfolio piece and a real pitch to a bakery owner. Inspired by a real bakery but
uses no real name, branding, people, numbers or addresses.

## Sources of truth

- `specs/millstone-spec.md`: features, decisions, data model, status flow,
  acceptance criteria (AC-xx). Read the relevant sections before every task.
- `design/README.md`: index of every designed screen (customer C1–C13, admin A2–A5).
- `design/system/`: tokens (`tokens.json`, `tokens.css`), component specs
  (`components/*/README.md`, `components/index.d.ts`), fonts.
- Design files are visual reference only: match layout, copy, spacing and states,
  but build real React components. Never import or copy `design/**/bundle.js`.
  Font/image URLs starting `/_blob/` in the design files will not load here.
- Customer side is mobile-first (designs at 390px). Admin side is tablet-first
  (designs at 1180px).

## Workflow

- The build happens in numbered steps, one branch per step (e.g. `feat/data-model`).
- Each step starts with a prompt from the user. Stay inside that step's scope;
  list anything out of scope in `specs/known-issues.md` instead of building it.
- Finish every step with: files changed, how it was verified, any spec/design
  inconsistencies found, and the exact git commands for the user to run.
- Never merge to main.

## Stack

- Runtime/package manager: **Bun** (never npm/yarn/pnpm)
- Framework: **Next.js** (App Router), latest stable, with React 19
- Styling: **Tailwind v4**, tokens in a `@theme` block
- Data fetching: **Axios + TanStack Query**. All data fetching goes through this.
- Auth: **Auth.js v5 (beta)** (`next-auth`), credentials provider only (no Google).
  Two user types: customers (optional accounts) and staff (`owner` | `staff`).
- Backend/data: **Firebase Admin SDK**, Firestore + Storage (Blaze plan),
  server-side only, never in Client Components, never `NEXT_PUBLIC_*`
- Payments: provider not decided yet (Square vs Stripe). Build behind a small
  payment adapter; implement **Stripe** (Checkout Sessions + webhooks, test mode,
  real integration, not mocked) as the first provider. "Pay at pickup" needs no provider.
- Email: behind a small adapter; in development, log emails to the console.
- Forms/validation: **React Hook Form + Zod**
- Linting: ESLint (`eslint-config-next`, core-web-vitals + typescript)
- QA: **Playwright**, run live during development, not a committed test suite

## Code style & structure

- Fully typed TypeScript (`strict`); split into separate files where sensible.
- Design tokens via CSS variables + Tailwind `@theme` block. **No hardcoded
  colors in components**; every color comes from a variable.
- **Light theme only** (spec 10a). Admin pages use `data-context="admin"`
  (64px controls, 72px Ready/Collected buttons, 20px body text, nothing under 16px).
  Admin rules: no swipes or hidden menus, every action has a word.
- Minimum Tailwind classes at the component level. Most elements come from
  `src/shared/components/...`, fully styled per the design system.
- **Module convention** (load-bearing): every feature lives under
  `src/modules/<feature>/` with an `api/content/components/hooks/lib/types` split.
- Shared, reusable UI lives in `src/shared/components`
  (atoms → molecules → organisms → templates), plus `src/shared/utils` and
  `src/shared/hooks`.
- UI copy is externalized into per-module content files from the first
  component. Never hardcode inline text speculatively "for now."
- Single source of truth for routes/API paths: `src/shared/routes.ts` /
  `api-routes.ts`. No hardcoded path strings elsewhere. Any compound route
  (e.g. sign-in with callback param) gets a helper, not a hand-built string.
- Root-level error boundaries (`error.tsx` + `global-error.tsx`) are part of
  the app shell, not a later add-on.

## Architectural decisions

- **Authorization:** `requireSession()`, `requireStaffSession()` and
  `requireOwnerSession()` are checked independently at the top of every
  relevant API route. Never rely on a page-level layout gate alone. A `staff`
  user can only read or change their own branch's data, enforced on the server.
  Customer sessions can never access admin routes. `proxy.ts` uses its own
  lightweight, provider-less NextAuth instance; its matcher excludes `/api`,
  so API routes must self-check.
- **Dates & time:** all cutoff, closed-day and pickup-date logic uses
  `Australia/Melbourne`, in one shared helper module. Never derive weekday
  names from hardcoded strings.
- **Money:** totals are always calculated on the server from current prices.
  Order items snapshot product name and unit price.
- **Firestore:** explicit field-mapping via mapper functions
  (`toProduct.ts`-style). Never spread `doc.data()` directly into a response.
  Natural slugs are the doc ID where one exists. Use `runTransaction` for
  read-then-write atomic operations.
  - Order numbers (`MS-1042`): transactional counter document.
  - Uniqueness the spec requires (e.g. one generated order per recurring order
    per pickup date): deterministic doc IDs (`{recurringOrderId}_{pickupDate}`)
    created with `create()`, so a second attempt fails instead of duplicating.
- **Cart:** client-side only (`localStorage`, keyed per user), tied to one
  branch and pickup date. No Firestore cart collection. Server always
  re-fetches live price, availability and sold-out status at checkout; never
  trusts client-submitted prices. Cart clears when the order is `placed`
  (pay at pickup) or payment is confirmed (online).
- **Checkout/Stripe:** server-only Checkout Session creation (`{ url }`
  returned, plain redirect, no Stripe.js/publishable key needed client-side).
  Use `constructEventAsync` for webhook verification under Bun. Idempotency
  via `processedStripeEventIds` on each order. Trust the webhook, never the redirect.
- **Images:** Firebase Storage with token-gated download URLs, not signed
  URLs or `makePublic()`. Server-side magic-byte validation of uploads.
  Products without an image show the letter placeholder from the design.
- **Sample/seed data:** follow spec section 4. Phones are ACMA fictional numbers
  (mobiles 0491 570 xxx, landlines (03) 7010 xxxx or (03) 5550 xxxx), emails use
  example.com, no real bakery names, people or addresses.
- **Error handling:** `logError(error, context, { level: "error" | "warn" })`
  wrapper. Every `catch` block logs AND sets visible UI state; no bare
  `catch {}`. Every form's `handleSubmit` has an `onInvalid` handler.

## Permissions

- Default: **Manual mode** (review every edit).
- **Plan mode** for architecture, security-relevant, or ambiguous decisions.
- **Auto mode** only for already-approved, low-risk, greenfield batches
  within a session. Never for secrets, payments, or auth logic.
- Auto-allowed: `git status`, `bun run lint`.
- Requires asking first: anything changing dependencies, pushing to a remote.
- Hard-denied (never, regardless of mode): `rm -rf`, force-push, reading
  `.env*` or credential files.
- The user runs all git operations themselves (branch, add, commit, push,
  merge). Claude Code provides exact commands to paste. Exception: concluding
  a git operation already mid-progress.
- Real secrets are never pasted into chat or written by Claude Code.

## Verification

- No committed automated test suite. Verification is live: ad hoc
  Playwright scripts per feature, run against a real local dev/build
  server, screenshots inspected directly, then deleted.
- Customer screens are checked at 390px wide, admin screens at 1180px.
- Security-critical flows (auth, permissions, payments): test **every**
  branch, not just the happy path. E.g. "customer blocked from admin" AND
  "staff allowed in", "staff blocked from another branch" AND "owner sees all".
- An independent Claude-in-Chrome QA pass follows every major feature
  phase, as a fresh-eyes second check after Claude Code's own verification.
- `git stash -u` is the standard way to confirm whether a build/lint issue
  is pre-existing vs. newly introduced.

### Local Stripe testing

- `stripe login` once, then `stripe listen --forward-to
  localhost:3000/api/webhooks/stripe`. It prints a `whsec_...` value for
  `STRIPE_WEBHOOK_SECRET` (this differs from the dashboard's production
  webhook secret; keep it updated in `.env.local` per dev session).
- Prefer driving a real Checkout Session through `/api/checkout` with test
  card `4242 4242 4242 4242` over `stripe trigger`. A `trigger`-synthesized
  event won't carry a real `metadata.orderId`, so the webhook handler has
  nothing real to update.
- Declined-card testing: `4000 0000 0000 0002`.

## Session hygiene

- New Claude Code sessions start at phase/task boundaries, explicitly
  flagged, not just mentioned in passing.
- Plan mode / research-and-propose before writing code on anything
  non-trivial. Read real files fresh; don't assume from memory.
- `specs/millstone-spec.md` is read-only source of truth, edited only when
  the user explicitly asks to change it.

## Known open items

Track in `specs/known-issues.md` (the one file in `specs/` Claude Code maintains):
undeployed infra steps, deferred features, investigated-but-unreproduced bugs,
un-applied migration scripts, known UX gaps.
