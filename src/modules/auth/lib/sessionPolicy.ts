import type { PrincipalKind } from "../types/session";

// How long a session lasts. Staff: one sign-in covers a whole shift; a tablet
// left signed in overnight asks again the next morning. Customers: a month,
// so a regular isn't asked every visit. Both count from sign-in and never
// slide, so an always-on device still expires.

const HOUR_SECONDS = 60 * 60;

export const STAFF_SESSION_MAX_AGE_SECONDS = 12 * HOUR_SECONDS;
export const CUSTOMER_SESSION_MAX_AGE_SECONDS = 30 * 24 * HOUR_SECONDS;

/** The cookie and JWT lifetime: the longest session. Shorter kinds end in the jwt callback. */
export const SESSION_MAX_AGE_SECONDS = Math.max(STAFF_SESSION_MAX_AGE_SECONDS, CUSTOMER_SESSION_MAX_AGE_SECONDS);

export function sessionMaxAgeSeconds(kind: PrincipalKind): number {
  return kind === "staff" ? STAFF_SESSION_MAX_AGE_SECONDS : CUSTOMER_SESSION_MAX_AGE_SECONDS;
}

/**
 * True once the session is past its kind's fixed lifetime, or has no sign-in
 * time or no kind (a token from no sign-in we know).
 */
export function isSessionExpired(
  kind: PrincipalKind | undefined,
  signedInAt: number | undefined,
  nowMs: number,
): boolean {
  if (kind !== "staff" && kind !== "customer") return true;
  if (typeof signedInAt !== "number" || !Number.isFinite(signedInAt)) return true;
  return nowMs - signedInAt > sessionMaxAgeSeconds(kind) * 1000;
}
