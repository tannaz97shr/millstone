import type { IsoInstant, Order } from "@/shared/domain";
import { ORDER_CURRENCY, type PaymentEvent } from "@/shared/lib/payments/paymentProvider";

// What a verified payment event does to an order (spec 6 and 7, AC-C6). Pure:
// applyPaymentEvent's transaction reads the order, asks this, and writes
// exactly what it returns. Events can arrive twice or out of order, so an
// order never moves backwards, a paid order never expires, and an event seen
// before changes nothing.

export type ActionablePaymentEvent = Exclude<PaymentEvent, { kind: "ignored" }>;

/** The fields an event writes, besides recording its ID. */
export type PaymentEventChanges = Partial<Pick<Order, "status" | "paymentStatus" | "paidAt" | "paymentRef">>;

export type PaymentEventOutcome =
  /** awaiting_payment → placed + paid: now on the admin list. */
  | "placed"
  /** awaiting_payment → expired: never shown to staff. */
  | "expired"
  /** This event was applied before. Nothing is written. */
  | "duplicate"
  /** Paid already (a second event for the same payment, or it came after a later change). */
  | "already_paid"
  /** An expiry for an order that's no longer waiting: it stays as it is. */
  | "not_waiting"
  /** Paid after it expired. It stays expired (spec 7: final); the money must be refunded. */
  | "paid_after_expiry"
  /** An event from a checkout page this order doesn't use. */
  | "other_session";

export interface PaymentEventPlan {
  outcome: PaymentEventOutcome;
  changes: PaymentEventChanges;
  /** False only for a duplicate: then nothing at all is written. */
  record: boolean;
  /** The confirmation email goes out (AC-C9), once, when the order becomes paid. */
  sendConfirmation: boolean;
  /** Something a person has to look at; logged as an error. */
  problem: string | null;
}

const plan = (outcome: PaymentEventOutcome, rest: Partial<PaymentEventPlan> = {}): PaymentEventPlan => ({
  outcome,
  changes: {},
  record: true,
  sendConfirmation: false,
  problem: null,
  ...rest,
});

type PlannedOrder = Pick<
  Order,
  | "orderNumber"
  | "status"
  | "paymentMethod"
  | "paymentStatus"
  | "paymentRef"
  | "totalCents"
  | "checkoutSessionId"
  | "processedStripeEventIds"
>;

export function planPaymentEvent(order: PlannedOrder, event: ActionablePaymentEvent, now: Date): PaymentEventPlan {
  if (order.processedStripeEventIds.includes(event.eventId)) return plan("duplicate", { record: false });

  // One checkout key makes one page, so another session ID means something is wrong.
  if (order.checkoutSessionId !== null && order.checkoutSessionId !== event.sessionId) {
    return plan("other_session", {
      problem: `${order.orderNumber}: ${event.kind} event for session ${event.sessionId}, but the order uses ${order.checkoutSessionId}`,
    });
  }

  if (event.kind === "expired") {
    return order.status === "awaiting_payment"
      ? plan("expired", { changes: { status: "expired" } })
      : plan("not_waiting");
  }

  const mismatch =
    event.amountCents !== order.totalCents || event.currency !== ORDER_CURRENCY
      ? `${order.orderNumber}: paid ${event.amountCents} ${event.currency}, but the order is ${order.totalCents} ${ORDER_CURRENCY}`
      : null;

  switch (order.status) {
    case "awaiting_payment":
      return plan("placed", {
        changes: {
          status: "placed",
          paymentStatus: "paid",
          paidAt: now.toISOString() as IsoInstant,
          paymentRef: event.paymentRef,
        },
        sendConfirmation: true,
        problem: mismatch,
      });

    case "expired":
      return plan("paid_after_expiry", {
        changes: { paymentRef: event.paymentRef },
        problem: `${order.orderNumber} was paid (${event.paymentRef}) after it expired. Refund it in Stripe.`,
      });

    default: {
      // placed, ready, collected or cancelled: already paid (or refunded) by this payment.
      const paidOnline = order.paymentMethod === "online" && order.paymentStatus !== "unpaid";
      const samePayment = order.paymentRef === null || order.paymentRef === event.paymentRef;
      return plan("already_paid", {
        problem:
          paidOnline && samePayment
            ? null
            : `${order.orderNumber} (${order.status}, ${order.paymentMethod}, ${order.paymentStatus}, ref ${order.paymentRef}) got a payment ${event.paymentRef}. Check it in Stripe.`,
      });
    }
  }
}
