import type Stripe from "stripe";
import type { Cents, OrderId } from "@/shared/domain";
import type { PaymentEvent } from "../paymentProvider";

// Turns a verified Stripe event into what orders care about. Pure (type-only
// Stripe import), so every event shape is unit-tested.

/** The session's order: metadata first, else client_reference_id (both are set at creation). */
function orderIdOf(session: Stripe.Checkout.Session): OrderId | null {
  const id = session.metadata?.orderId ?? session.client_reference_id;
  return id ? (id as OrderId) : null;
}

function paymentIntentIdOf(session: Stripe.Checkout.Session): string | null {
  const intent = session.payment_intent;
  if (!intent) return null;
  return typeof intent === "string" ? intent : intent.id;
}

/**
 * `livemode` is what the configured key expects: an event from the other mode
 * (a test event reaching a live endpoint, or the reverse) is ignored.
 */
export function toPaymentEvent(event: Stripe.Event, livemode: boolean): PaymentEvent {
  const ignored = (reason: string): PaymentEvent => ({ kind: "ignored", eventId: event.id, type: event.type, reason });
  if (event.livemode !== livemode) return ignored(`livemode is ${event.livemode}`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const orderId = orderIdOf(session);
      if (!orderId) return ignored("no order ID on the session");
      // Card only (allowed_payment_method_types), so a completed session is paid at once.
      if (session.payment_status !== "paid") return ignored(`payment_status is ${session.payment_status}`);
      const paymentRef = paymentIntentIdOf(session) ?? session.id;
      return {
        kind: "paid",
        eventId: event.id,
        orderId,
        sessionId: session.id,
        paymentRef,
        amountCents: (session.amount_total ?? 0) as Cents,
        currency: (session.currency ?? "").toLowerCase(),
      };
    }
    case "checkout.session.expired": {
      const session = event.data.object;
      const orderId = orderIdOf(session);
      if (!orderId) return ignored("no order ID on the session");
      return { kind: "expired", eventId: event.id, orderId, sessionId: session.id };
    }
    default:
      return ignored("not an event orders use");
  }
}
