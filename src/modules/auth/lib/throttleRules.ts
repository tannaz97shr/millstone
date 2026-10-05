// Slows down password guessing for one email address: after MAX_FAILURES
// failed sign-ins within WINDOW_MS, that email is locked for LOCK_MS. Unknown
// emails are counted the same way, so the lock never says an account exists.

export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60 * 1000;
export const LOCK_MS = 15 * 60 * 1000;

export interface ThrottleState {
  failures: number;
  /** Epoch ms of the first failure in the current window. */
  windowStartMs: number;
  /** Epoch ms the lock ends, or null when not locked. */
  lockedUntilMs: number | null;
}

export function isLocked(state: ThrottleState | null, nowMs: number): boolean {
  return state?.lockedUntilMs != null && nowMs < state.lockedUntilMs;
}

/** The state after one more failed sign-in. */
export function recordFailure(state: ThrottleState | null, nowMs: number): ThrottleState {
  const fresh = !state || nowMs - state.windowStartMs > WINDOW_MS || (state.lockedUntilMs !== null && nowMs >= state.lockedUntilMs);
  const failures = fresh ? 1 : state.failures + 1;
  const windowStartMs = fresh ? nowMs : state.windowStartMs;
  return {
    failures,
    windowStartMs,
    lockedUntilMs: failures >= MAX_FAILURES ? nowMs + LOCK_MS : null,
  };
}

/**
 * When a record no longer matters and can be deleted (Firestore TTL on
 * `expiresAt`): once its window has passed and any lock has ended.
 */
export function throttleExpiresAtMs(state: ThrottleState): number {
  return Math.max(state.windowStartMs + WINDOW_MS, state.lockedUntilMs ?? 0);
}
