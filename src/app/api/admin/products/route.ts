import { requireOwnerSession } from "@/modules/auth/lib/requireSession";
import { listProducts } from "@/modules/catalog/lib/listProducts";
import { jsonResponse, routeHandler } from "@/shared/lib/api/routeHandler";

// A5 product catalogue, owner only: 401 signed out, 403 staff or another
// kind of session. The first of the products step's endpoints.
export const GET = routeHandler("GET /api/admin/products", async () => {
  await requireOwnerSession();
  return jsonResponse({ products: await listProducts() });
});
