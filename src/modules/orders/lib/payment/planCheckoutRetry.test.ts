import { describe, expect, test } from "bun:test";
import type { IsoInstant, Order } from "@/shared/domain";
import { isLazilyExpired, paymentExpiresAtFor } from "./paymentWindow";
import { planCheckoutRetry } from "./planCheckoutRetry";

const CREATED = new Date("2026-10-06T03:00:00.000Z");
const minutesAfter = (minutes: number) => new Date(CREATED.getTime() + minutes * 60_000);

type RetriedOrder = Pick<Order, "status" | "checkoutSessionId" | "createdAt" | "paymentExpiresAt">;

function order(overrides: Partial<RetriedOrder> = {}): RetriedOrder {
  return {
    status: "awaiting_payment",
    checkoutSessionId: "cs_test_1",
    createdAt: CREATED.toISOString() as IsoInstant,
    paymentExpiresAt: paymentExpiresAtFor(CREATED),
    ...overrides,
  };
}

describe("planCheckoutRetry", () => {
  test("waiting with an open page: the same checkout goes back to that page", () => {
    expect(planCheckoutRetry(order(), true, minutesAfter(10))).toEqual({ kind: "existing" });
    expect(planCheckoutRetry(order(), true, minutesAfter(54))).toEqual({ kind: "existing" });
  });

  test("waiting, but its page closes within 5 minutes: abandoned", () => {
    expect(planCheckoutRetry(order(), true, minutesAfter(56))).toEqual({ kind: "abandoned", expireNow: false });
  });

  test("waiting with no page yet: reused only while a new page can still get 30 minutes", () => {
    const noPage = order({ checkoutSessionId: null });
    expect(planCheckoutRetry(noPage, true, minutesAfter(28))).toEqual({ kind: "existing" });
    expect(planCheckoutRetry(noPage, true, minutesAfter(30))).toEqual({ kind: "abandoned", expireNow: false });
  });

  test("waiting, and the customer changed the order (or chose Pay at pickup): abandoned", () => {
    expect(planCheckoutRetry(order(), false, minutesAfter(5))).toEqual({ kind: "abandoned", expireNow: false });
  });

  test("an abandoned order with no page, past its window and grace, is expired there and then", () => {
    const noPage = order({ checkoutSessionId: null });
    expect(planCheckoutRetry(noPage, true, minutesAfter(66))).toEqual({ kind: "abandoned", expireNow: true });
    expect(planCheckoutRetry(noPage, false, minutesAfter(66))).toEqual({ kind: "abandoned", expireNow: true });
    // With a page, Stripe's own expiry event does it.
    expect(planCheckoutRetry(order(), true, minutesAfter(66))).toEqual({ kind: "abandoned", expireNow: false });
  });

  test("expired: always abandoned", () => {
    expect(planCheckoutRetry(order({ status: "expired" }), true, minutesAfter(5))).toEqual({
      kind: "abandoned",
      expireNow: false,
    });
  });

  test("placed (paid, or pay at pickup): the same checkout gets the order, a different one is a mismatch", () => {
    for (const status of ["placed", "ready", "collected", "cancelled"] as const) {
      expect(planCheckoutRetry(order({ status }), true, minutesAfter(200))).toEqual({ kind: "existing" });
      expect(planCheckoutRetry(order({ status }), false, minutesAfter(200))).toEqual({ kind: "mismatch" });
    }
  });

  test("orders saved before step 10 (no paymentExpiresAt) count the hour from createdAt", () => {
    const old = order({ paymentExpiresAt: null, checkoutSessionId: null });
    expect(planCheckoutRetry(old, true, minutesAfter(10))).toEqual({ kind: "existing" });
    expect(planCheckoutRetry(old, true, minutesAfter(70))).toEqual({ kind: "abandoned", expireNow: true });
  });
});

describe("isLazilyExpired", () => {
  test("only a waiting order with no page, more than 5 minutes past its hour", () => {
    const noPage = order({ checkoutSessionId: null });
    expect(isLazilyExpired(noPage, minutesAfter(64))).toBe(false);
    expect(isLazilyExpired(noPage, minutesAfter(66))).toBe(true);
    expect(isLazilyExpired(order(), minutesAfter(600))).toBe(false);
    expect(isLazilyExpired({ ...noPage, status: "placed" }, minutesAfter(600))).toBe(false);
    expect(isLazilyExpired({ ...noPage, status: "expired" }, minutesAfter(600))).toBe(false);
  });
});
