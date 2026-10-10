import { listAccountOrders } from "@/modules/account/lib/accountOrders";
import { requireCustomerSession } from "@/modules/auth/lib/requireSession";
import { jsonResponse, routeHandler } from "@/shared/lib/api/routeHandler";

// C9 "Your orders": the signed-in customer's own history, newest pickup day
// first. 401 signed out, 403 a staff session.
export const GET = routeHandler("GET /api/account/orders", async () => {
  const customer = await requireCustomerSession();
  return jsonResponse(await listAccountOrders(customer.id));
});
