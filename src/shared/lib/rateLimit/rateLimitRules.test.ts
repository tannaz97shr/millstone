import { describe, expect, test } from "bun:test";
import { clientIp, decideRateLimit, ipBucket, RATE_LIMITS, rateLimitExpiresAtMs } from "./rateLimitRules";

const policy = { id: "test", limit: 3, windowMs: 60_000 };
const T0 = 1_760_000_000_000;

describe("decideRateLimit", () => {
  test("the first request opens a window", () => {
    expect(decideRateLimit(null, policy, T0)).toEqual({ allowed: true, next: { count: 1, windowStartMs: T0 } });
  });

  test("counts up to the limit, then refuses with the seconds left", () => {
    let state = { count: 1, windowStartMs: T0 };
    for (const count of [2, 3]) {
      const decision = decideRateLimit(state, policy, T0 + 1_000);
      expect(decision).toEqual({ allowed: true, next: { count, windowStartMs: T0 } });
      if (decision.allowed) state = decision.next;
    }
    expect(decideRateLimit(state, policy, T0 + 20_500)).toEqual({ allowed: false, retryAfterSeconds: 40 });
  });

  test("never says to wait less than a second", () => {
    expect(decideRateLimit({ count: 3, windowStartMs: T0 }, policy, T0 + 59_999)).toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });
  });

  test("a new window starts once the old one ends", () => {
    expect(decideRateLimit({ count: 3, windowStartMs: T0 }, policy, T0 + 60_000)).toEqual({
      allowed: true,
      next: { count: 1, windowStartMs: T0 + 60_000 },
    });
  });

  test("a window from the future (clock skew) starts over rather than locking", () => {
    expect(decideRateLimit({ count: 3, windowStartMs: T0 + 5_000 }, policy, T0).allowed).toBe(true);
  });

  test("the proposed limits", () => {
    expect(RATE_LIMITS.orders).toEqual({ id: "orders", limit: 10, windowMs: 3_600_000 });
    expect(RATE_LIMITS.staffSignIn).toEqual({ id: "staff-sign-in", limit: 20, windowMs: 900_000 });
    expect(RATE_LIMITS.customerSignIn).toEqual({ id: "customer-sign-in", limit: 20, windowMs: 900_000 });
    expect(RATE_LIMITS.customerSignUp).toEqual({ id: "customer-sign-up", limit: 10, windowMs: 3_600_000 });
    expect(RATE_LIMITS.accountWrite).toEqual({ id: "account-write", limit: 30, windowMs: 900_000 });
  });

  test("every policy counts on its own (distinct doc ID prefixes)", () => {
    const ids = Object.values(RATE_LIMITS).map((limit) => limit.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

test("a state expires when its window ends", () => {
  expect(rateLimitExpiresAtMs({ count: 2, windowStartMs: T0 }, policy)).toBe(T0 + 60_000);
});

describe("ipBucket", () => {
  test("IPv4 stays as it is", () => {
    expect(ipBucket(" 203.0.113.7 ")).toBe("203.0.113.7");
  });

  test("an IPv4-mapped IPv6 address is unwrapped", () => {
    expect(ipBucket("::ffff:203.0.113.7")).toBe("203.0.113.7");
  });

  test("IPv6 counts by its /64, however it's written", () => {
    expect(ipBucket("2001:db8:abcd:12::1")).toBe("2001:db8:abcd:12::/64");
    expect(ipBucket("2001:0DB8:ABCD:0012:ffff:1:2:3")).toBe("2001:db8:abcd:12::/64");
    expect(ipBucket("2001:db8::1")).toBe("2001:db8:0:0::/64");
    expect(ipBucket("fe80::1%en0")).toBe("fe80:0:0:0::/64");
  });

  test("something unreadable is kept as it is, so it still counts", () => {
    expect(ipBucket("not-an-ip")).toBe("not-an-ip");
    expect(ipBucket("1::2::3")).toBe("1::2::3");
  });
});

describe("clientIp", () => {
  test("the first x-forwarded-for entry", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  test("x-real-ip when there's no x-forwarded-for", () => {
    expect(clientIp(new Headers({ "x-real-ip": "203.0.113.8" }))).toBe("203.0.113.8");
  });

  test("null when neither is there", () => {
    expect(clientIp(new Headers())).toBeNull();
    expect(clientIp(new Headers({ "x-forwarded-for": " " }))).toBeNull();
  });
});
