import "server-only";
import { after } from "next/server";
import type { ParsedPlaceOrderRequest } from "@/modules/checkout/lib/checkoutSchema";
import type { PlaceOrderResponse } from "@/modules/checkout/types/placeOrder";
import type { Order } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { closeAbandonedPayment, startOnlinePayment } from "./payment/startOnlinePayment";
import { placeOrder } from "./placeOrder";
import { sendOrderConfirmation } from "./sendOrderConfirmation";
import { toOrderConfirmation } from "./toOrderConfirmation";

export interface PlaceCheckoutResult {
  status: 200 | 201;
  response: PlaceOrderResponse;
}

const abandoned = (order: Order) => {
  // After the response: close its page so a forgotten tab can't pay for it.
  after(() => closeAbandonedPayment(order));
  return new ApiError(
    409,
    "payment_abandoned",
    `${order.orderNumber} wasn't paid and can't be now; place the cart under a new checkout key`,
  );
};

/**
 * POST /api/orders from start to finish. Pay at pickup: the order is placed
 * and its confirmation emailed. Online: the order waits for payment, and the
 * customer is sent to the provider's page; the email goes when the webhook
 * says it's paid (applyPaymentEvent), never here.
 */
export async function placeCheckout(request: ParsedPlaceOrderRequest): Promise<PlaceCheckoutResult> {
  const result = await placeOrder(request);
  if (result.outcome === "abandoned") throw abandoned(result.order);

  const { order, branch } = result;
  const status = result.outcome === "created" ? 201 : 200;
  const base = { orderId: order.id, orderNumber: order.orderNumber };

  if (order.status === "awaiting_payment") {
    const page = await startOnlinePayment(order, branch);
    if (page.state === "open" && page.url) {
      return { status, response: { ...base, next: "pay", paymentUrl: page.url } };
    }
    // Paid, but the webhook hasn't arrived yet: C6 waits for it.
    if (page.state === "complete") return { status, response: { ...base, next: "confirmation" } };
    // The page closed unpaid; the expiry webhook will mark the order.
    throw abandoned({ ...order, checkoutSessionId: page.sessionId });
  }

  if (result.outcome === "created") {
    const confirmation = toOrderConfirmation(order, branch);
    after(() => sendOrderConfirmation(confirmation));
  }
  return { status, response: { ...base, next: "confirmation" } };
}
