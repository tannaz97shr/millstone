import type { Order } from "@/shared/domain";
import { isLazilyExpired, NEW_PAGE_MIN_REMAINING_MS, paymentDeadline, REUSE_MARGIN_MS } from "./paymentWindow";

// What Place order does when its checkout key already made an order. Pure, so
// every case is unit-tested; placeOrder's transaction carries it out.

export type CheckoutRetry =
  /** The same order: show its confirmation, or send the customer back to its payment page. */
  | { kind: "existing" }
  /**
   * The key placed a different order, and that order went through (step 5's
   * lost response): 409 checkout_key_mismatch, and C5 offers to see it.
   */
  | { kind: "mismatch" }
  /**
   * The key's order was never paid and can't be now, or the customer changed
   * the order after coming back from payment: 409 payment_abandoned, and C5
   * places the cart under a new key. `expireNow`: also write it as expired.
   */
  | { kind: "abandoned"; expireNow: boolean };

type RetriedOrder = Pick<Order, "status" | "checkoutSessionId" | "createdAt" | "paymentExpiresAt">;

/**
 * `same` is isSameCheckout: the same branch, day, payment method and items.
 * An unpaid order is only reused while its payment page can still be paid in:
 * an existing page until 5 minutes before it closes, or time enough to open one.
 */
export function planCheckoutRetry(order: RetriedOrder, same: boolean, now: Date): CheckoutRetry {
  switch (order.status) {
    case "awaiting_payment": {
      const left = paymentDeadline(order) - now.getTime();
      const needed = order.checkoutSessionId === null ? NEW_PAGE_MIN_REMAINING_MS : REUSE_MARGIN_MS;
      if (same && left > needed) return { kind: "existing" };
      return { kind: "abandoned", expireNow: isLazilyExpired(order, now) };
    }
    case "expired":
      return { kind: "abandoned", expireNow: false };
    default:
      return same ? { kind: "existing" } : { kind: "mismatch" };
  }
}
