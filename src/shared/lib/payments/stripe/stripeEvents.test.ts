import { describe, expect, test } from "bun:test";
import type Stripe from "stripe";
import { toPaymentEvent } from "./stripeEvents";

// Minimal event shapes: only the fields toPaymentEvent reads.
function sessionEvent(type: string, session: Record<string, unknown>, livemode = false): Stripe.Event {
  return {
    id: "evt_1",
    object: "event",
    type,
    livemode,
    data: {
      object: {
        id: "cs_test_1",
        object: "checkout.session",
        metadata: { orderId: "order-1", orderNumber: "MS-1048" },
        client_reference_id: "order-1",
        payment_status: "paid",
        payment_intent: "pi_test_1",
        amount_total: 2070,
        currency: "aud",
        ...session,
      },
    },
  } as unknown as Stripe.Event;
}

describe("toPaymentEvent", () => {
  test("a paid checkout.session.completed", () => {
    expect(toPaymentEvent(sessionEvent("checkout.session.completed", {}), false)).toEqual({
      kind: "paid",
      eventId: "evt_1",
      orderId: "order-1" as never,
      sessionId: "cs_test_1",
      paymentRef: "pi_test_1",
      amountCents: 2070 as never,
      currency: "aud",
    });
  });

  test("an expanded payment intent gives its ID", () => {
    const event = sessionEvent("checkout.session.completed", { payment_intent: { id: "pi_test_2" } });
    expect(toPaymentEvent(event, false)).toMatchObject({ kind: "paid", paymentRef: "pi_test_2" });
  });

  test("completed but not paid is ignored", () => {
    const event = sessionEvent("checkout.session.completed", { payment_status: "unpaid" });
    expect(toPaymentEvent(event, false).kind).toBe("ignored");
  });

  test("checkout.session.expired", () => {
    expect(toPaymentEvent(sessionEvent("checkout.session.expired", { payment_status: "unpaid" }), false)).toEqual({
      kind: "expired",
      eventId: "evt_1",
      orderId: "order-1" as never,
      sessionId: "cs_test_1",
    });
  });

  test("the order ID falls back to client_reference_id", () => {
    const event = sessionEvent("checkout.session.expired", { metadata: {} });
    expect(toPaymentEvent(event, false)).toMatchObject({ kind: "expired", orderId: "order-1" });
  });

  test("no order ID at all (a `stripe trigger` event) is ignored", () => {
    const event = sessionEvent("checkout.session.completed", { metadata: {}, client_reference_id: null });
    expect(toPaymentEvent(event, false).kind).toBe("ignored");
  });

  test("other types, and events from the other mode, are ignored", () => {
    expect(toPaymentEvent(sessionEvent("payment_intent.succeeded", {}), false).kind).toBe("ignored");
    expect(toPaymentEvent(sessionEvent("checkout.session.completed", {}, true), false).kind).toBe("ignored");
  });
});
