import { adminOrderRouteParamsSchema } from "@/modules/admin-orders/lib/adminOrderParams";
import { getAdminOrder, orderNotFound } from "@/modules/admin-orders/lib/getAdminOrder";
import { requireStaffSession } from "@/modules/auth/lib/requireSession";
import { jsonResponse, routeHandler } from "@/shared/lib/api/routeHandler";

// A3 order detail. Staff or owner: 401 signed out, 403 not a staff session,
// 404 missing, hidden, or another branch's order (never 403, so it can't
// confirm the order exists).
export const GET = routeHandler(
  "GET /api/admin/orders/[orderId]",
  async (_request, { params }: { params: Promise<{ orderId: string }> }) => {
    const actor = await requireStaffSession();
    const parsed = adminOrderRouteParamsSchema.safeParse(await params);
    if (!parsed.success) throw orderNotFound();
    return jsonResponse(await getAdminOrder(actor, parsed.data.orderId));
  },
);
