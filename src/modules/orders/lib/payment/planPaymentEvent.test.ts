import { describe, expect, test } from "bun:test";
import type { Cents, Order, OrderId } from "@/shared/domain";
import { type ActionablePaymentEvent, planPaymentEvent } from "./planPaymentEvent";

const NOW = new Date("2026-10-06T03:00:00.000Z");
const ORDER_ID = "6f1c2a9e-3b7d-4c41-9a2e-8d5f0b7c1e23" as OrderId;

type PlannedOrder = Parameters<typeof planPaymentEvent>[0];

function order(overrides: Partial<Order> = {}): PlannedOrder {
  return {
    orderNumber: "MS-1048",
    status: "awaiting_payment",
    paymentMethod: "online",
    paymentStatus: "unpaid",
    paymentRef: null,
    totalCents: 2070 as Cents,
    checkoutSessionId: "cs_test_1",
    processedStripeEventIds: [],
    ...overrides,
  };
}

const paid = (overrides: Partial<Extract<ActionablePaymentEvent, { kind: "paid" }>> = {}): ActionablePaymentEvent => ({
  kind: "paid",
  eventId: "evt_paid",
  orderId: ORDER_ID,
  sessionId: "cs_test_1",
  paymentRef: "pi_test_1",
  amountCents: 2070 as Cents,
  currency: "aud",
  ...overrides,
});

const expired = (overrides: Partial<Extract<ActionablePaymentEvent, { kind: "expired" }>> = {}): ActionablePaymentEvent => ({
  kind: "expired",
  eventId: "evt_expired",
  orderId: ORDER_ID,
  sessionId: "cs_test_1",
  ...overrides,
});

/** An order after a plan's changes are written. */
const after = (before: PlannedOrder, event: ActionablePaymentEvent): PlannedOrder => {
  const plan = planPaymentEvent(before, event, NOW);
  return {
    ...before,
    ...plan.changes,
    processedStripeEventIds: plan.record ? [...before.processedStripeEventIds, event.eventId] : before.processedStripeEventIds,
  };
};

describe("planPaymentEvent: paid", () => {
  test("an order waiting for payment is placed and paid, with paidAt and the payment reference", () => {
    const plan = planPaymentEvent(order(), paid(), NOW);
    expect(plan.outcome).toBe("placed");
    expect(plan.changes).toEqual({
      status: "placed",
      paymentStatus: "paid",
      paidAt: NOW.toISOString() as Order["paidAt"],
      paymentRef: "pi_test_1",
    });
    expect(plan.record).toBe(true);
    expect(plan.sendConfirmation).toBe(true);
    expect(plan.problem).toBeNull();
  });

  test("the same event again changes nothing and sends no second email", () => {
    const once = after(order(), paid());
    const plan = planPaymentEvent(once, paid(), NOW);
    expect(plan).toMatchObject({ outcome: "duplicate", record: false, sendConfirmation: false, changes: {} });
  });

  test("a second event for the same payment (a new event ID) is recorded only", () => {
    const once = after(order(), paid());
    const plan = planPaymentEvent(once, paid({ eventId: "evt_paid_again" }), NOW);
    expect(plan).toMatchObject({ outcome: "already_paid", record: true, sendConfirmation: false, changes: {} });
    expect(plan.problem).toBeNull();
  });

  test("arriving after staff moved the order on (ready, collected, cancelled, refunded) never moves it back", () => {
    const paidOrder = { paymentStatus: "paid" as const, paymentRef: "pi_test_1" };
    for (const status of ["placed", "ready", "collected", "cancelled"] as const) {
      const plan = planPaymentEvent(order({ ...paidOrder, status }), paid({ eventId: "evt_late" }), NOW);
      expect(plan.outcome).toBe("already_paid");
      expect(plan.changes).toEqual({});
      expect(plan.problem).toBeNull();
    }
    const refunded = planPaymentEvent(
      order({ status: "cancelled", paymentStatus: "refunded", paymentRef: "pi_test_1" }),
      paid({ eventId: "evt_late" }),
      NOW,
    );
    expect(refunded).toMatchObject({ outcome: "already_paid", changes: {}, problem: null });
  });

  test("a different payment for an order already paid is flagged", () => {
    const plan = planPaymentEvent(
      order({ status: "placed", paymentStatus: "paid", paymentRef: "pi_test_1" }),
      paid({ eventId: "evt_other", paymentRef: "pi_test_2" }),
      NOW,
    );
    expect(plan.outcome).toBe("already_paid");
    expect(plan.changes).toEqual({});
    expect(plan.problem).toContain("pi_test_2");
  });

  test("paid after it expired: stays expired (final), keeps the reference, and asks for a refund", () => {
    const plan = planPaymentEvent(order({ status: "expired" }), paid(), NOW);
    expect(plan.outcome).toBe("paid_after_expiry");
    expect(plan.changes).toEqual({ paymentRef: "pi_test_1" });
    expect(plan.sendConfirmation).toBe(false);
    expect(plan.problem).toContain("Refund");
  });

  test("an amount or currency that doesn't match is still placed (the money was taken) but flagged", () => {
    const short = planPaymentEvent(order(), paid({ amountCents: 1000 as Cents }), NOW);
    expect(short.outcome).toBe("placed");
    expect(short.problem).toContain("1000");
    const usd = planPaymentEvent(order(), paid({ currency: "usd" }), NOW);
    expect(usd.outcome).toBe("placed");
    expect(usd.problem).toContain("usd");
  });

  test("an order with no saved page accepts its first event", () => {
    expect(planPaymentEvent(order({ checkoutSessionId: null }), paid(), NOW).outcome).toBe("placed");
  });

  test("an event for another page than the order's changes nothing", () => {
    const plan = planPaymentEvent(order(), paid({ sessionId: "cs_test_other" }), NOW);
    expect(plan.outcome).toBe("other_session");
    expect(plan.changes).toEqual({});
    expect(plan.problem).not.toBeNull();
  });
});

describe("planPaymentEvent: expired", () => {
  test("an order still waiting expires", () => {
    const plan = planPaymentEvent(order(), expired(), NOW);
    expect(plan).toMatchObject({ outcome: "expired", changes: { status: "expired" }, record: true });
    expect(plan.sendConfirmation).toBe(false);
  });

  test("a paid order never expires, whatever order the events come in", () => {
    const paidFirst = after(order(), paid());
    const plan = planPaymentEvent(paidFirst, expired(), NOW);
    expect(plan).toMatchObject({ outcome: "not_waiting", changes: {} });
    for (const status of ["placed", "ready", "collected", "cancelled"] as const) {
      expect(planPaymentEvent(order({ status, paymentStatus: "paid" }), expired(), NOW).changes).toEqual({});
    }
  });

  test("expired twice: the second is a duplicate; another expiry event changes nothing", () => {
    const once = after(order(), expired());
    expect(once.status).toBe("expired");
    expect(planPaymentEvent(once, expired(), NOW).outcome).toBe("duplicate");
    expect(planPaymentEvent(once, expired({ eventId: "evt_expired_2" }), NOW)).toMatchObject({
      outcome: "not_waiting",
      changes: {},
    });
  });

  test("expired, then paid (out of order) stays expired", () => {
    const once = after(order(), expired());
    expect(planPaymentEvent(once, paid(), NOW).outcome).toBe("paid_after_expiry");
  });
});

describe("what a payment event may change", () => {
  // applyPaymentEvent writes only these fields (plus the event ID), so an
  // order placed signed in keeps its customerId and accountId when the
  // webhook marks it paid, and shows in C9 from then on.
  const PAYMENT_FIELDS = new Set(["status", "paymentStatus", "paymentRef", "paidAt"]);
  const signedIn = { customerId: "cust-1", accountId: "cust-1" } as Partial<Order>;

  test.each([
    ["paid while waiting", order(signedIn), paid()],
    ["paid after expiry", order({ ...signedIn, status: "expired" }), paid()],
    ["paid again", order({ ...signedIn, status: "placed", paymentStatus: "paid" }), paid({ eventId: "evt_2" })],
    ["expired while waiting", order(signedIn), expired()],
  ])("%s: only payment fields change", (_label, before, event) => {
    const { changes } = planPaymentEvent(before, event, NOW);
    for (const key of Object.keys(changes)) expect(PAYMENT_FIELDS.has(key)).toBe(true);
  });

  test("paid while waiting places the order", () => {
    expect(planPaymentEvent(order(signedIn), paid(), NOW).changes).toMatchObject({
      status: "placed",
      paymentStatus: "paid",
    });
  });
});
