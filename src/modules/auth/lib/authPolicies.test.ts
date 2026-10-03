import { describe, expect, test } from "bun:test";
import { safeAdminReturnPath } from "./returnPath";
import { isSessionExpired, SESSION_MAX_AGE_SECONDS } from "./sessionPolicy";
import { isLocked, LOCK_MS, MAX_FAILURES, recordFailure, WINDOW_MS, type ThrottleState } from "./throttleRules";

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
  test("lasts 12 hours from sign-in", () => {
    expect(isSessionExpired(signedInAt, signedInAt + SESSION_MAX_AGE_SECONDS * 1000)).toBe(false);
    expect(isSessionExpired(signedInAt, signedInAt + SESSION_MAX_AGE_SECONDS * 1000 + 1)).toBe(true);
  });
  test("a token without a sign-in time is expired", () => {
    expect(isSessionExpired(undefined, signedInAt)).toBe(true);
    expect(isSessionExpired(Number.NaN, signedInAt)).toBe(true);
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
});
