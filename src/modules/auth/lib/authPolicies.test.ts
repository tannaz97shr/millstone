import { describe, expect, test } from "bun:test";
import { safeAdminReturnPath, safeCustomerReturnPath } from "./returnPath";
import {
  CUSTOMER_SESSION_MAX_AGE_SECONDS,
  isSessionExpired,
  SESSION_MAX_AGE_SECONDS,
  STAFF_SESSION_MAX_AGE_SECONDS,
} from "./sessionPolicy";
import {
  isLocked,
  LOCK_MS,
  MAX_FAILURES,
  recordFailure,
  throttleExpiresAtMs,
  WINDOW_MS,
  type ThrottleState,
} from "./throttleRules";

describe("safeAdminReturnPath", () => {
  test("keeps an admin path with its query", () => {
    expect(safeAdminReturnPath("/admin")).toBe("/admin");
    expect(safeAdminReturnPath("/admin?status=ready&order=abc")).toBe("/admin?status=ready&order=abc");
    expect(safeAdminReturnPath("/admin/availability")).toBe("/admin/availability");
  });

  test("falls back to /admin for anything else", () => {
    for (const value of [
      null,
      undefined,
      "",
      "//evil.example",
      "//evil.example/admin",
      "https://evil.example/admin",
      "/\\evil.example",
      "admin",
      "/",
      "/menu/northcote",
      "/administrator",
      "/admin/sign-in",
      "/admin/sign-in?returnTo=/admin",
    ]) {
      expect(safeAdminReturnPath(value)).toBe("/admin");
    }
  });

  test("normalises dot segments before checking", () => {
    expect(safeAdminReturnPath("/admin/../menu")).toBe("/admin");
  });
});

describe("isSessionExpired", () => {
  const signedInAt = Date.UTC(2026, 9, 3, 20, 0);
  const after = (seconds: number) => signedInAt + seconds * 1000;

  test("staff sessions last 12 hours from sign-in", () => {
    expect(STAFF_SESSION_MAX_AGE_SECONDS).toBe(12 * 60 * 60);
    expect(isSessionExpired("staff", signedInAt, after(STAFF_SESSION_MAX_AGE_SECONDS))).toBe(false);
    expect(isSessionExpired("staff", signedInAt, after(STAFF_SESSION_MAX_AGE_SECONDS) + 1)).toBe(true);
  });

  test("customer sessions last 30 days from sign-in", () => {
    expect(CUSTOMER_SESSION_MAX_AGE_SECONDS).toBe(30 * 24 * 60 * 60);
    expect(isSessionExpired("customer", signedInAt, after(STAFF_SESSION_MAX_AGE_SECONDS) + 1)).toBe(false);
    expect(isSessionExpired("customer", signedInAt, after(CUSTOMER_SESSION_MAX_AGE_SECONDS))).toBe(false);
    expect(isSessionExpired("customer", signedInAt, after(CUSTOMER_SESSION_MAX_AGE_SECONDS) + 1)).toBe(true);
  });

  test("the cookie lives as long as the longest session", () => {
    expect(SESSION_MAX_AGE_SECONDS).toBe(CUSTOMER_SESSION_MAX_AGE_SECONDS);
  });

  test("a token without a sign-in time, or of no known kind, is expired", () => {
    expect(isSessionExpired("staff", undefined, signedInAt)).toBe(true);
    expect(isSessionExpired("customer", Number.NaN, signedInAt)).toBe(true);
    expect(isSessionExpired(undefined, signedInAt, signedInAt)).toBe(true);
  });
});

describe("safeCustomerReturnPath", () => {
  test("keeps a customer page with its query", () => {
    expect(safeCustomerReturnPath("/checkout")).toBe("/checkout");
    expect(safeCustomerReturnPath("/menu/northcote?date=2026-10-08")).toBe("/menu/northcote?date=2026-10-08");
    expect(safeCustomerReturnPath("/")).toBe("/");
    expect(safeCustomerReturnPath("/account/orders/abc")).toBe("/account/orders/abc");
  });

  test("falls back to My account for anything else", () => {
    for (const value of [
      null,
      undefined,
      "",
      "checkout",
      "//evil.example",
      "https://evil.example/checkout",
      "/\\evil.example",
      "/admin",
      "/admin/products",
      "/api/account/session",
      "/account/sign-in",
      "/account/sign-in?returnTo=/checkout",
      "/account/sign-up",
      "/account/forgot-password",
      "/menu/../admin",
    ]) {
      expect(safeCustomerReturnPath(value)).toBe("/account");
    }
  });

  test("a path that only starts like an excluded one is fine", () => {
    expect(safeCustomerReturnPath("/administrator")).toBe("/administrator");
    expect(safeCustomerReturnPath("/apiary")).toBe("/apiary");
  });
});

describe("sign-in throttle", () => {
  const t0 = Date.UTC(2026, 9, 3, 22, 0);

  function failTimes(times: number, start: ThrottleState | null = null, at = t0): ThrottleState | null {
    let state = start;
    for (let i = 0; i < times; i += 1) state = recordFailure(state, at + i * 1000);
    return state;
  }

  test(`locks after ${MAX_FAILURES} failures within the window`, () => {
    const four = failTimes(MAX_FAILURES - 1);
    expect(isLocked(four, t0 + 5000)).toBe(false);
    const five = recordFailure(four, t0 + 5000);
    expect(five.failures).toBe(MAX_FAILURES);
    expect(isLocked(five, t0 + 5001)).toBe(true);
    expect(isLocked(five, t0 + 5000 + LOCK_MS)).toBe(false);
  });

  test("failures spread beyond the window start a new count", () => {
    const four = failTimes(MAX_FAILURES - 1);
    const later = recordFailure(four, t0 + WINDOW_MS + 1);
    expect(later.failures).toBe(1);
    expect(later.lockedUntilMs).toBeNull();
  });

  test("a failure after the lock ends starts a new count", () => {
    const locked = failTimes(MAX_FAILURES);
    const after = recordFailure(locked, (locked?.lockedUntilMs ?? 0) + 1);
    expect(after.failures).toBe(1);
    expect(isLocked(after, (locked?.lockedUntilMs ?? 0) + 2)).toBe(false);
  });

  test("no record is never locked", () => {
    expect(isLocked(null, t0)).toBe(false);
  });

  test("a record expires once its window has passed and its lock has ended", () => {
    const one = recordFailure(null, t0);
    expect(throttleExpiresAtMs(one)).toBe(t0 + WINDOW_MS);
    const locked = recordFailure(failTimes(MAX_FAILURES - 1), t0 + 5000);
    expect(throttleExpiresAtMs(locked)).toBe(t0 + 5000 + LOCK_MS);
    expect(isLocked(locked, throttleExpiresAtMs(locked))).toBe(false);
  });
});
