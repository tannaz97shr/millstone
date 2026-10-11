import { requireCustomerSession } from "@/modules/auth/lib/requireSession";
import { getRecurringOrderDetail } from "@/modules/recurring-orders/lib/recurringOrderReads";
import { updateRecurringOrder } from "@/modules/recurring-orders/lib/recurringOrderWrites";
import { recurringRouteParamsSchema, updateRecurringRequestSchema } from "@/modules/recurring-orders/lib/recurringSchemas";
import { ApiError } from "@/shared/lib/api/apiError";
import { jsonResponse, parseBody, routeHandler } from "@/shared/lib/api/routeHandler";
import { assertSameOrigin } from "@/shared/lib/api/sameOrigin";
import { enforceRateLimit } from "@/shared/lib/rateLimit/rateLimit";
import { RATE_LIMITS } from "@/shared/lib/rateLimit/rateLimitRules";

type Context = { params: Promise<{ recurringOrderId: string }> };

async function recurringOrderIdOf({ params }: Context): Promise<string> {
  const parsed = recurringRouteParamsSchema.safeParse(await params);
  // A malformed ID answers like a missing one.
  if (!parsed.success) throw new ApiError(404, "not_found", "No such recurring order in this account");
  return parsed.data.recurringOrderId;
}

// C12 and C11 edit: one of the signed-in customer's recurring orders, with
// its upcoming pickups. 401 signed out, 403 a staff session, 404 missing,
// malformed or someone else's (one answer for all).
export const GET = routeHandler("GET /api/account/recurring-orders/[recurringOrderId]", async (_request, context: Context) => {
  const customer = await requireCustomerSession();
  return jsonResponse(await getRecurringOrderDetail(customer.id, await recurringOrderIdOf(context), new Date()));
});

// C11 edit (AC-R4): days, items, notes, the end date, and the start until
// the first pickup. 200 the detail, 400 invalid body, 401, 403 (staff or
// cross-site), 404, 409 `recurring_changed` (saved elsewhere) / `not_allowed`
// (ended) / `date_locked`, 422 `closed_day` / `start_too_early` /
// `items_unavailable` / `not_scheduled`, 429, 503 `try_again`.
export const PATCH = routeHandler("PATCH /api/account/recurring-orders/[recurringOrderId]", async (request, context: Context) => {
  assertSameOrigin(request);
  const customer = await requireCustomerSession();
  await enforceRateLimit(request, RATE_LIMITS.recurringWrite);
  const recurringOrderId = await recurringOrderIdOf(context);
  const body = await parseBody(updateRecurringRequestSchema, request);
  const now = new Date();
  await updateRecurringOrder(customer.id, recurringOrderId, body, now);
  return jsonResponse(await getRecurringOrderDetail(customer.id, recurringOrderId, now));
});
