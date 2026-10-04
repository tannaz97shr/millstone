import { adminOrderRouteParamsSchema } from "@/modules/admin-orders/lib/adminOrderParams";
import { applyOrderAction } from "@/modules/admin-orders/lib/applyOrderAction";
import { orderNotFound } from "@/modules/admin-orders/lib/getAdminOrder";
import { orderActionSchema } from "@/modules/admin-orders/lib/orderActionSchema";
import { requireStaffSession } from "@/modules/auth/lib/requireSession";
import { jsonResponse, parseBody, routeHandler } from "@/shared/lib/api/routeHandler";
import { assertSameOrigin } from "@/shared/lib/api/sameOrigin";

// A2/A3 staff actions: ready, collect, undo, cancel, mark refunded. 401
// signed out, 403 not a staff session or a cross-site request, 404 missing,
// hidden or another branch's order, 400 a bad body, 409 when the order
// isn't in the state the staff member saw (or the Undo window has passed).
export const POST = routeHandler(
  "POST /api/admin/orders/[orderId]/actions",
  async (request, { params }: { params: Promise<{ orderId: string }> }) => {
    const actor = await requireStaffSession();
    assertSameOrigin(request);
    const parsed = adminOrderRouteParamsSchema.safeParse(await params);
    if (!parsed.success) throw orderNotFound();
    const action = await parseBody(orderActionSchema, request);
    return jsonResponse(await applyOrderAction(actor, parsed.data.orderId, action));
  },
);
