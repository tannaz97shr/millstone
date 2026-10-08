import { getAccountOrder } from "@/modules/account/lib/accountOrders";
import { requireCustomerSession } from "@/modules/auth/lib/requireSession";
import { anyOrderRouteParamsSchema } from "@/modules/orders/lib/orderParams";
import { ApiError } from "@/shared/lib/api/apiError";
import { jsonResponse, routeHandler } from "@/shared/lib/api/routeHandler";

// One of the signed-in customer's own orders. 401 signed out, 403 a staff
// session, 404 missing, malformed, not in this account's history, or never
// placed (one answer for all, so an ID can't be probed).
export const GET = routeHandler(
  "GET /api/account/orders/[orderId]",
  async (_request, { params }: { params: Promise<{ orderId: string }> }) => {
    const customer = await requireCustomerSession();
    const parsed = anyOrderRouteParamsSchema.safeParse(await params);
    if (!parsed.success) throw new ApiError(404, "not_found", "No such order");
    return jsonResponse(await getAccountOrder(customer.id, parsed.data.orderId));
  },
);
