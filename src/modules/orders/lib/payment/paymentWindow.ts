import type { IsoInstant, Order } from "@/shared/domain";

// How long an online order waits for payment (spec 6: "expire after ~1 hour").
// Pure: shared by checkout, the seed and the expiry rules.

/** The checkout page stays open this long; Stripe allows 30 minutes to 24 hours. */
export const PAYMENT_WINDOW_MS = 60 * 60_000;

/**
 * A retry this close to the end of the window starts a new order instead of
 * sending the customer to a page about to close.
 */
export const REUSE_MARGIN_MS = 5 * 60_000;

/**
 * A new checkout page needs at least 30 minutes before it closes (Stripe's
 * minimum for `expires_at`), plus a minute for the request itself.
 */
export const NEW_PAGE_MIN_REMAINING_MS = 31 * 60_000;

/**
 * An order whose checkout page was never created has no webhook to expire it,
 * so it's expired when next read, this long after its window ends.
 */
export const LAZY_EXPIRY_GRACE_MS = 5 * 60_000;

export function paymentExpiresAtFor(createdAt: Date): IsoInstant {
  return new Date(createdAt.getTime() + PAYMENT_WINDOW_MS).toISOString() as IsoInstant;
}

/** The end of the window; orders saved before step 10 have none, so it's counted from createdAt. */
export function paymentDeadline(order: Pick<Order, "createdAt" | "paymentExpiresAt">): number {
  return order.paymentExpiresAt
    ? Date.parse(order.paymentExpiresAt)
    : Date.parse(order.createdAt) + PAYMENT_WINDOW_MS;
}

/**
 * Still waiting, with no checkout page that Stripe will expire, and past its
 * window: it can be written as expired (spec 6) whenever it's next read.
 */
export function isLazilyExpired(
  order: Pick<Order, "status" | "checkoutSessionId" | "createdAt" | "paymentExpiresAt">,
  now: Date,
): boolean {
  return (
    order.status === "awaiting_payment" &&
    order.checkoutSessionId === null &&
    now.getTime() > paymentDeadline(order) + LAZY_EXPIRY_GRACE_MS
  );
}
