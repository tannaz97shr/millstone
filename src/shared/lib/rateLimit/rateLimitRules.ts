// Per-IP rate limits for the public POSTs (pure; Firestore side in
// rateLimit.ts). A fixed window per policy and address: the first request
// opens it, and once `limit` requests are counted the rest are refused until
// it ends.

export interface RateLimitPolicy {
  /** Part of the doc ID, so each route counts on its own. */
  id: string;
  limit: number;
  windowMs: number;
}

const MINUTE_MS = 60 * 1000;

export const RATE_LIMITS = {
  /** Guest checkout: generous for a shared café or mobile-carrier address. */
  orders: { id: "orders", limit: 10, windowMs: 60 * MINUTE_MS },
  /** Staff sign-in: a branch's counter network, plus the per-email lock (throttleRules.ts). */
  staffSignIn: { id: "staff-sign-in", limit: 20, windowMs: 15 * MINUTE_MS },
} as const satisfies Record<string, RateLimitPolicy>;

export interface RateLimitState {
  count: number;
  /** Epoch ms of the window's first request. */
  windowStartMs: number;
}

export type RateLimitDecision =
  | { allowed: true; next: RateLimitState }
  /** Nothing is written for a refused request. */
  | { allowed: false; retryAfterSeconds: number };

/** Whether one more request is allowed, and the state to save if so. */
export function decideRateLimit(
  state: RateLimitState | null,
  policy: RateLimitPolicy,
  nowMs: number,
): RateLimitDecision {
  const open = state !== null && nowMs >= state.windowStartMs && nowMs - state.windowStartMs < policy.windowMs;
  if (!open) return { allowed: true, next: { count: 1, windowStartMs: nowMs } };
  if (state.count >= policy.limit) {
    const remainingMs = state.windowStartMs + policy.windowMs - nowMs;
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)) };
  }
  return { allowed: true, next: { count: state.count + 1, windowStartMs: state.windowStartMs } };
}

/** When a state can be deleted (Firestore TTL): its window has ended. */
export function rateLimitExpiresAtMs(state: RateLimitState, policy: RateLimitPolicy): number {
  return state.windowStartMs + policy.windowMs;
}

/** Expands an IPv6 address to its eight groups, or null if it isn't one. */
function ipv6Groups(address: string): string[] | null {
  const halves = address.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const groups = [...head, ...Array<string>(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  return groups.every((group) => /^[0-9a-f]{1,4}$/.test(group)) ? groups : null;
}

/**
 * The address a limit counts against: IPv4 as it is (an IPv4-mapped IPv6
 * address is unwrapped), IPv6 by its /64, since one device or home usually
 * holds a whole /64.
 */
export function ipBucket(ip: string): string {
  const address = ip.trim().toLowerCase();
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(address);
  if (mapped) return mapped[1];
  if (!address.includes(":")) return address;
  const groups = ipv6Groups(address.replace(/%.*$/, ""));
  if (!groups) return address;
  return `${groups.slice(0, 4).map((group) => group.replace(/^0+(?=.)/, "")).join(":")}::/64`;
}

/**
 * The client's address. Vercel overwrites x-forwarded-for with the real
 * client address, so a client can't choose it there; null when there's none
 * (e.g. `next dev` without a proxy).
 */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get("x-real-ip")?.trim() || null;
}
