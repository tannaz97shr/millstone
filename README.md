# Millstone

An ordering site for a three-branch bakery: pickup only, pay at pickup (online payment comes later), and a simple order list for staff at the counter.

- **Built with:** Next.js (App Router) with Bun, Tailwind v4, TanStack Query, Auth.js, and Firebase (Firestore and Storage, server-side only).
- **Where the details live:** features and decisions in `specs/millstone-spec.md`, open items in `specs/known-issues.md`, and the screens in `design/README.md`.

## Local development

```bash
bun install
bun run emulators      # Firestore + Storage emulators (needs a JDK 21+)
bun run seed           # demo data into the emulator (--reset wipes it first)
bun run dev            # http://localhost:3000, settings from .env.local
bun run test           # unit tests for the pure rules
bun run lint
```

## Deploying

The site runs on **Vercel**, on the Firebase project **`millstone-dc47f`**. That project is the **live** one: the public site's data. There is no staging project.

### Safety rules

- **`--reset` never runs against the live project.** The seed and migration guard refuses it, and only the emulator can be wiped.
- **Only `main` deploys.** `vercel.json` turns off every other branch, and all variables are scoped to **Production**. A preview, however it's made, has no credentials and can't reach the live data.
- **Local commands that use live data say so.** They read only `.env.live.local` (copy `.env.live.local.example`) and print a "LIVE DATA" warning:

  | Command | What it does |
  |---|---|
  | `bun run dev:live` | `next dev` against live data |
  | `bun run seed:live` | seeds the demo data (idempotent, no reset) |
  | `bun run migrate:orders:live` | the order migration |
  | `bun run cleanup:smoke:live` | removes what the smoke test made |

### One-time setup

1. **Service account.** In Google Cloud (project `millstone-dc47f`), create a service account for Vercel with only **Cloud Datastore User** and **Storage Object Admin**, then create a JSON key for it. Keep the file outside the repo.
2. **Firestore TTL policies.** These prune old rate-limit and sign-in records. In the console, go to Firestore → TTL, or run:
   ```bash
   gcloud firestore fields ttls update expiresAt --collection-group=rateLimits --enable-ttl --project=millstone-dc47f
   gcloud firestore fields ttls update expiresAt --collection-group=signInThrottle --enable-ttl --project=millstone-dc47f
   ```
3. **Rules and indexes** (only when `firestore.rules`, `firestore.indexes.json` or `storage.rules` change):
   ```bash
   bunx firebase deploy --only firestore:rules,firestore:indexes,storage --project live
   ```
4. **Vercel project.**
   - Import the GitHub repo. The framework is Next.js; Vercel installs with Bun from `bun.lock`.
   - Set the production branch to `main`.
   - The function region comes from `vercel.json` (`syd1`). Check it in the deployment summary.
5. **Environment variables.** Set these for **Production only**. Mark the secrets *Sensitive*.

   | Name | Value |
   |---|---|
   | `FIREBASE_PROJECT_ID` | `millstone-dc47f` |
   | `FIREBASE_STORAGE_BUCKET` | `millstone-dc47f.firebasestorage.app` (also read at build, for `next/image`) |
   | `FIREBASE_CLIENT_EMAIL` | the service account's `client_email` |
   | `FIREBASE_PRIVATE_KEY` | the JSON's `private_key` value, without its surrounding quotes, keeping every `\n` as typed |
   | `AUTH_SECRET` | a new secret: `openssl rand -base64 33` |
   | `AUTH_TRUST_HOST` | `true` |
   | `ONLINE_PAYMENTS_ENABLED` | `false` |

   **Never set:** any `*_EMULATOR_HOST` variable (not even empty), `DEV_PAGES`, `GOOGLE_APPLICATION_CREDENTIALS` or `SEED_*`.

   **Checking the key:** a key pasted wrongly shows in the function logs at startup as "FIREBASE_PRIVATE_KEY isn't a readable PEM key". The value is never logged.

### Each deploy

1. Merge to `main`; Vercel builds and deploys it.
2. If the release changes stored data, run its migration first (`bun run migrate:orders:live` and any newer ones listed in `specs/known-issues.md`).
3. Optionally, refresh the demo data's dates: `bun run seed:live`.

### Smoke test after a deploy

Run against the live URL (Playwright, at 390px for the customer side and 1180px for the admin):
- C1 → C7 with one pay-at-pickup order as `smoke-test@example.com`
- sign in as the owner
- find the order on A2 and cancel it with a reason
- A4: mark something sold out, then back on sale
- A5: upload a phone photo over 4.5 MB to a product without one. The browser shrinks it, and the server stores a 1200 × 900 WebP.
- check that `/dev/emails` is a 404
- last, check the rate limits answer 429: junk `POST /api/orders` requests, and sign-ins with made-up `smoke-limit-N@example.com` emails

Then clean up. Without `--yes`, the command only prints what it would delete:

```bash
bun run cleanup:smoke:live -- --order=MS-NNNN --product=<product-id>
bun run cleanup:smoke:live -- --order=MS-NNNN --product=<product-id> --yes
```

### What the live site does differently

- **Emails are off** (no provider yet). C5 and C7 don't promise one.
- **`/dev/*` is a 404**, whatever `DEV_PAGES` says.
- **Photos:** uploads must be under 4 MB, so A5 shrinks photos in the browser first.
- **Rate limits:** orders are limited to 10 per address per hour, and staff sign-in to 20 per address per 15 minutes.
- **Headers:** security headers and a static-friendly CSP are set in `next.config.mjs`.
