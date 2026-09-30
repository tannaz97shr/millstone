# Known issues and open items

Maintained by Claude Code. The spec (`millstone-spec.md`) stays the source of truth; this file tracks loose ends.

## Undeployed infra steps

_None yet._

## Deferred features

_None yet._

## Investigated but unreproduced bugs

_None yet._

## Un-applied migration scripts

_None yet._

## Known UX gaps

- **Wrong weekday in design-system docs.** `design/system/README.md` ("Pickup Tue 30 Sep at Northcote"), the `admin-title` sample in `tokens.json` ("Today · Tue 30 Sep") and the ProductCard docs ("Sold out for Tue 30 Sep") say Tuesday. 30 Sep 2026 is a Wednesday. The code always derives weekday names from the date.

## Tooling and housekeeping

- **`/dev/tokens` is publicly reachable.** Remove it or gate it to development before launch.
- **ESLint held at 9, TypeScript held at 6.0.** `eslint-plugin-react` (via `eslint-config-next`) doesn't support ESLint 10 yet, and `typescript-eslint` needs TypeScript below 6.1. Upgrade once they catch up.
- **Node 21.1.0 locally.** It's end-of-life. Next 16 works with it, but Node 24 LTS is recommended.
- **Stray `~/package-lock.json`** outside the repo made Next guess the wrong workspace root. `turbopack.root` is pinned in `next.config.mjs` to work around it.
- **`next-env.d.ts` is tracked** even though `.gitignore` lists it; Next regenerates it on every build.
