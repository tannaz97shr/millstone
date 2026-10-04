import { listAdminOrders } from "@/modules/admin-orders/lib/listAdminOrders";
import { adminOrderFiltersSchema, filterInput } from "@/modules/admin-orders/lib/orderFilters";
import { requireStaffSession } from "@/modules/auth/lib/requireSession";
import { jsonResponse, parseParams, routeHandler } from "@/shared/lib/api/routeHandler";

// A2 order list. Staff or owner: 401 signed out, 403 not a staff session or
// staff asking for another branch, 400 an unknown filter value.
export const GET = routeHandler("GET /api/admin/orders", async (request) => {
  const actor = await requireStaffSession();
  const filters = parseParams(adminOrderFiltersSchema, filterInput(new URL(request.url).searchParams));
  return jsonResponse(await listAdminOrders(actor, filters, new Date()));
});
