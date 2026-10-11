import { requireCustomerSession } from "@/modules/auth/lib/requireSession";
import { getRecurringOrderDetail, listRecurringOrders } from "@/modules/recurring-orders/lib/recurringOrderReads";
import { createRecurringOrder } from "@/modules/recurring-orders/lib/recurringOrderWrites";
import { createRecurringRequestSchema } from "@/modules/recurring-orders/lib/recurringSchemas";
import { jsonResponse, parseBody, routeHandler } from "@/shared/lib/api/routeHandler";
import { assertSameOrigin } from "@/shared/lib/api/sameOrigin";
import { enforceRateLimit } from "@/shared/lib/rateLimit/rateLimit";
import { RATE_LIMITS } from "@/shared/lib/rateLimit/rateLimitRules";

// C10 / C9: the signed-in customer's recurring orders, live ones first.
// 401 signed out, 403 a staff session.
export const GET = routeHandler("GET /api/account/recurring-orders", async () => {
  const customer = await requireCustomerSession();
  return jsonResponse(await listRecurringOrders(customer.id, new Date()));
});

// C11 new (AC-R2). Customers only: 201 the new order's detail, 400 invalid
// body, 401 signed out, 403 a staff session or cross-site, 404
// `unknown_branch`, 422 `closed_day` / `start_too_early` (with `earliest`) /
// `not_scheduled` / `items_unavailable` (with `items`) / `limit_reached`,
// 409 `date_locked` (an end date already closed), 429 too many from this address.
export const POST = routeHandler("POST /api/account/recurring-orders", async (request) => {
  assertSameOrigin(request);
  const customer = await requireCustomerSession();
  await enforceRateLimit(request, RATE_LIMITS.recurringCreate);
  const body = await parseBody(createRecurringRequestSchema, request);
  const now = new Date();
  const id = await createRecurringOrder(customer.id, body, now);
  return jsonResponse(await getRecurringOrderDetail(customer.id, id, now), 201);
});
