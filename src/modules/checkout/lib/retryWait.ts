// How long C5 tells a rate-limited customer to wait, from the 429's
// Retry-After. Pure, so it's unit-tested.

/**
 * Whole minutes, rounded up so the customer never comes back too early.
 * Null when there's no usable wait: C5 then says "in an hour", the window's length.
 */
export function waitMinutes(retryAfterSeconds: number | undefined): number | null {
  if (retryAfterSeconds === undefined || !Number.isFinite(retryAfterSeconds) || retryAfterSeconds <= 0) return null;
  return Math.max(1, Math.ceil(retryAfterSeconds / 60));
}
