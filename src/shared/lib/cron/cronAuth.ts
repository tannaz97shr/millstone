import { createHash, timingSafeEqual } from "node:crypto";

// Vercel calls a cron path with `Authorization: Bearer $CRON_SECRET`. The
// secret is the only credential: the cron routes have no session and no rate
// limit, like the Stripe webhook. Pure, so the rules are unit-tested.

export type CronAuthDecision =
  /** CRON_SECRET isn't set (or is blank): the job is off, and the route says so (503). */
  | "not_configured"
  | "denied"
  | "allowed";

/** Shorter than this and it's treated as unset: a guessable secret is no secret. */
export const MIN_CRON_SECRET_LENGTH = 16;

const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();

/**
 * Compares the header with the secret in constant time (as digests, so the
 * lengths always match). Anything but exactly "Bearer <secret>" is denied.
 */
export function decideCronAuth(authorization: string | null, secret: string | undefined): CronAuthDecision {
  if (!secret || secret.trim().length < MIN_CRON_SECRET_LENGTH) return "not_configured";
  if (!authorization) return "denied";
  return timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`)) ? "allowed" : "denied";
}
