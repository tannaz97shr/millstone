import { getOptionalCustomer } from "@/modules/auth/lib/requireSession";
import { placeOrderRequestSchema } from "@/modules/checkout/lib/checkoutSchema";
import { placeCheckout } from "@/modules/orders/lib/placeCheckout";
import { jsonResponse, parseBody, routeHandler } from "@/shared/lib/api/routeHandler";
import { enforceRateLimit } from "@/shared/lib/rateLimit/rateLimit";
import { RATE_LIMITS } from "@/shared/lib/rateLimit/rateLimitRules";

// Public: guests check out without a session. A customer session links the
// order to that account (a staff session counts as a guest). The body never
// carries a price.
// 201 placed (or waiting for payment, with `paymentUrl`), 200 the checkout key
// already made this order, 400 invalid body, 404 unknown branch, 409 items
// unavailable, price changed, the key placed a different order, or its unpaid
// online order was abandoned, 422 the day can't be ordered or the payment
// method isn't offered, 429 too many requests from this address (every
// request counts, before the body is read), 503 Firestore too slow or the
// payment page couldn't be opened.
export const POST = routeHandler("POST /api/orders", async (request) => {
  await enforceRateLimit(request, RATE_LIMITS.orders);
  const body = await parseBody(placeOrderRequestSchema, request);
  const account = await getOptionalCustomer();
  const { status, response } = await placeCheckout(body, account?.id ?? null);
  return jsonResponse(response, status);
});
