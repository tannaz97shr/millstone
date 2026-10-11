import { after } from "next/server";
import { listAdminOrders } from "@/modules/admin-orders/lib/listAdminOrders";
import { adminOrderFiltersSchema, filterInput } from "@/modules/admin-orders/lib/orderFilters";
import { branchScope, requireStaffSession } from "@/modules/auth/lib/requireSession";
import { catchUpGeneration } from "@/modules/recurring-orders/lib/generation/catchUpGeneration";
import { jsonResponse, parseParams, routeHandler } from "@/shared/lib/api/routeHandler";

// A2 order list. Staff or owner: 401 signed out, 403 not a staff session or
// staff asking for another branch, 400 an unknown filter value.
//
// After answering, it makes any recurring orders already due for the
// branches in view (catchUpGeneration), so they show on the next refresh
// instead of waiting for the daily cron.

/** Room for the catch-up's 20s budget after the response, whatever the platform's default. */
export const maxDuration = 30;

export const GET = routeHandler("GET /api/admin/orders", async (request) => {
  const actor = await requireStaffSession();
  const filters = parseParams(adminOrderFiltersSchema, filterInput(new URL(request.url).searchParams));
  const now = new Date();
  const response = jsonResponse(await listAdminOrders(actor, filters, now));
  const scope = branchScope(actor, filters.branch);
  after(() => catchUpGeneration(scope, now));
  return response;
});
