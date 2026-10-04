import { describe, expect, test } from "bun:test";
import type { AdminOrderDetail } from "../types/adminOrder";
import { isRefundDue, orderHistory, paymentLine } from "./orderDetailView";

const base = {
  status: "placed",
  paymentMethod: "at_pickup",
  paymentStatus: "unpaid",
  paymentRef: null,
  createdAt: "2026-10-03T05:00:00.000Z",
  paidAt: null,
  readyAt: null,
  collectedAt: null,
  cancelledAt: null,
  refundedAt: null,
} as unknown as AdminOrderDetail;

const order = (overrides: Partial<AdminOrderDetail>) => ({ ...base, ...overrides }) as AdminOrderDetail;

describe("orderHistory", () => {
  test("only what happened, oldest first", () => {
    const history = orderHistory(
      order({
        status: "collected",
        paymentStatus: "paid",
        readyAt: "2026-10-04T21:05:00.000Z" as never,
        collectedAt: "2026-10-04T21:58:00.000Z" as never,
        paidAt: "2026-10-04T21:58:00.000Z" as never,
      }),
    );
    expect(history.map((h) => h.event)).toEqual(["placed", "ready", "paid", "collected"]);
  });

  test("paid online comes right after placed", () => {
    const history = orderHistory(order({ paidAt: "2026-10-03T05:01:00.000Z" as never }));
    expect(history.map((h) => h.event)).toEqual(["placed", "paid"]);
  });
});

describe("paymentLine and refunds", () => {
  test("unpaid, nothing paid, paid, refunded", () => {
    expect(paymentLine(order({})).kind).toBe("unpaid");
    expect(paymentLine(order({ status: "cancelled" })).kind).toBe("nothing_paid");
    expect(paymentLine(order({ paymentStatus: "paid", paymentRef: "PAY-1" })).kind).toBe("paid");
    expect(paymentLine(order({ status: "cancelled", paymentStatus: "refunded" })).kind).toBe("refunded");
  });

  test("refund due only on a cancelled order paid online", () => {
    expect(isRefundDue(order({ status: "cancelled", paymentMethod: "online", paymentStatus: "paid" }))).toBe(true);
    expect(isRefundDue(order({ status: "cancelled", paymentMethod: "online", paymentStatus: "refunded" }))).toBe(false);
    expect(isRefundDue(order({ status: "collected", paymentMethod: "online", paymentStatus: "paid" }))).toBe(false);
    expect(isRefundDue(order({ status: "cancelled" }))).toBe(false);
  });
});
