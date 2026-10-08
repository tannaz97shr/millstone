import { getOptionalCustomer } from "@/modules/auth/lib/requireSession";
import { getOrderConfirmation } from "@/modules/orders/lib/getOrderConfirmation";
import { orderRouteParamsSchema } from "@/modules/orders/lib/orderParams";
import { ApiError } from "@/shared/lib/api/apiError";
import { jsonResponse, routeHandler } from "@/shared/lib/api/routeHandler";

// Public: the order's unguessable ID is the only credential (C7). Returns only
// what the confirmation shows. A malformed ID is a 404 like a missing order,
// so the response never says which IDs are well formed. `accountOffer` depends
// on the viewer: never for a signed-in customer.
export const GET = routeHandler(
  "GET /api/orders/[orderId]",
  async (_request, { params }: { params: Promise<{ orderId: string }> }) => {
    const parsed = orderRouteParamsSchema.safeParse(await params);
    if (!parsed.success) throw new ApiError(404, "not_found", "No such order");
    const viewer = await getOptionalCustomer();
    return jsonResponse(await getOrderConfirmation(parsed.data.orderId, viewer !== null));
  },
);
