import { requireCustomerSession } from "@/modules/auth/lib/requireSession";
import { getRecurringOrderDetail } from "@/modules/recurring-orders/lib/recurringOrderReads";
import { applyRecurringAction } from "@/modules/recurring-orders/lib/recurringOrderWrites";
import { recurringActionRequestSchema, recurringRouteParamsSchema } from "@/modules/recurring-orders/lib/recurringSchemas";
import { ApiError } from "@/shared/lib/api/apiError";
import { jsonResponse, parseBody, routeHandler } from "@/shared/lib/api/routeHandler";
import { assertSameOrigin } from "@/shared/lib/api/sameOrigin";
import { enforceRateLimit } from "@/shared/lib/rateLimit/rateLimit";
import { RATE_LIMITS } from "@/shared/lib/rateLimit/rateLimitRules";

type Context = { params: Promise<{ recurringOrderId: string }> };

// C12: pause, resume (AC-R6), skip and undo a day (AC-R5), end now or
// after a pickup day (AC-R7). 200 the detail, 400 invalid body, 401, 403
// (staff or cross-site), 404 (missing, malformed or someone else's), 409
// `recurring_changed` / `date_locked` (that day's cutoff passed) /
// `not_scheduled` / `not_allowed` (ended, or already paused), 429, 503 `try_again`.
export const POST = routeHandler(
  "POST /api/account/recurring-orders/[recurringOrderId]/actions",
  async (request, { params }: Context) => {
    assertSameOrigin(request);
    const customer = await requireCustomerSession();
    await enforceRateLimit(request, RATE_LIMITS.recurringWrite);
    const parsed = recurringRouteParamsSchema.safeParse(await params);
    if (!parsed.success) throw new ApiError(404, "not_found", "No such recurring order in this account");
    const body = await parseBody(recurringActionRequestSchema, request);
    const now = new Date();
    await applyRecurringAction(customer.id, parsed.data.recurringOrderId, body, now);
    return jsonResponse(await getRecurringOrderDetail(customer.id, parsed.data.recurringOrderId, now));
  },
);
