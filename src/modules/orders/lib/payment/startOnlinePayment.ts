import "server-only";
import type { Branch, Order } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { getDb } from "@/shared/lib/firebase/admin";
import { ordersRef } from "@/shared/lib/firebase/collections";
import type { CheckoutPage } from "@/shared/lib/payments/paymentProvider";
import { paymentProvider, paymentsSiteUrl } from "@/shared/lib/payments/paymentsConfig";
import { routes } from "@/shared/routes";
import { logError } from "@/shared/utils/logError";
import { withDeadline } from "@/shared/utils/withDeadline";
import { paymentExpiresAtFor } from "./paymentWindow";

const SAVE_SESSION_DEADLINE_MS = 5_000;

const unavailable = (order: Order) =>
  new ApiError(503, "payment_unavailable", `The payment page for ${order.orderNumber} couldn't be opened`);

/** The stable idempotency key for an order's one payment page. */
export const checkoutIdempotencyKey = (order: Pick<Order, "id">) => `checkout-session:${order.id}`;

/**
 * Remembers which page belongs to the order, so lazy expiry knows Stripe will
 * expire it. Only while it's still waiting, and never over another page.
 * A failure is logged and changes nothing for the customer: the webhook finds
 * the order from the page's metadata either way.
 */
async function saveCheckoutSession(order: Order, sessionId: string): Promise<void> {
  const ref = ordersRef().doc(order.id);
  try {
    await withDeadline(
      getDb().runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists) return;
        if (snapshot.get("status") !== "awaiting_payment") return;
        const current = snapshot.get("checkoutSessionId") as unknown;
        if (current !== undefined && current !== null) return;
        tx.update(ref, { checkoutSessionId: sessionId });
      }),
      SAVE_SESSION_DEADLINE_MS,
      () => new Error(`Saving the checkout session took over ${SAVE_SESSION_DEADLINE_MS}ms`),
    );
  } catch (error) {
    logError(error, `saveCheckoutSession ${order.orderNumber}`, { level: "warn" });
  }
}

/**
 * Opens (or, for a retry, finds again) the provider's page for an order that's
 * waiting for payment. Every parameter comes from the stored order, never the
 * request, so the same order always sends the same parameters and the
 * idempotency key returns the same page instead of a second one.
 * The provider failing is a 503 payment_unavailable: nothing was charged and
 * the order stays hidden until it expires.
 */
export async function startOnlinePayment(order: Order, branch: Pick<Branch, "name">): Promise<CheckoutPage> {
  const provider = paymentProvider();
  const siteUrl = paymentsSiteUrl();
  if (!provider || !siteUrl) {
    throw new ApiError(422, "payment_method_unavailable", "Online payment is switched off");
  }

  let page: CheckoutPage;
  try {
    page = await provider.createCheckout({
      orderId: order.id,
      orderNumber: order.orderNumber,
      branchName: branch.name,
      contactEmail: order.contactEmail,
      lines: order.items.map((item) => ({
        name: item.productName,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
      })),
      totalCents: order.totalCents,
      expiresAt: order.paymentExpiresAt ?? paymentExpiresAtFor(new Date(order.createdAt)),
      successUrl: siteUrl + routes.orderConfirmation(order.id),
      cancelUrl: siteUrl + routes.checkoutPaymentCancelled,
      idempotencyKey: checkoutIdempotencyKey(order),
    });
  } catch (error) {
    logError(error, `startOnlinePayment ${order.orderNumber}`);
    throw unavailable(order);
  }

  if (page.state === "open" && !page.url) {
    logError(new Error(`Open session ${page.sessionId} has no URL`), `startOnlinePayment ${order.orderNumber}`);
    throw unavailable(order);
  }
  if (order.checkoutSessionId === null) await saveCheckoutSession(order, page.sessionId);
  return page;
}

/**
 * Closes the page of an order the customer moved on from (payment_abandoned),
 * so a forgotten tab can't still pay for it. Runs after the response; the
 * provider's expiry webhook then marks the order expired. Best effort.
 */
export async function closeAbandonedPayment(order: Order): Promise<void> {
  if (order.checkoutSessionId === null) return;
  const provider = paymentProvider();
  if (!provider) return;
  try {
    await provider.expireCheckout(order.checkoutSessionId);
  } catch (error) {
    logError(error, `closeAbandonedPayment ${order.orderNumber}`, { level: "warn" });
  }
}
