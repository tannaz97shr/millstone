import { after } from "next/server";
import { placeOrderRequestSchema } from "@/modules/checkout/lib/checkoutSchema";
import type { PlaceOrderResponse } from "@/modules/checkout/types/placeOrder";
import { placeOrder } from "@/modules/orders/lib/placeOrder";
import { sendOrderConfirmation } from "@/modules/orders/lib/sendOrderConfirmation";
import { jsonResponse, parseBody, routeHandler } from "@/shared/lib/api/routeHandler";

// Public: guests check out without a session. The body never carries a price.
// 201 placed, 200 the checkout key already placed this order, 400 invalid body,
// 404 unknown branch, 409 items unavailable or price changed, 422 the day
// can't be ordered or the payment method isn't offered, 503 Firestore too slow.
export const POST = routeHandler("POST /api/orders", async (request) => {
  const body = await parseBody(placeOrderRequestSchema, request);
  const result = await placeOrder(body);
  const response: PlaceOrderResponse = { orderId: result.orderId, orderNumber: result.orderNumber };
  if (!result.created) return jsonResponse(response, 200);

  const { confirmation } = result;
  after(() => sendOrderConfirmation(confirmation));
  return jsonResponse(response, 201);
});
