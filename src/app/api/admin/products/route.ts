import { requireOwnerSession } from "@/modules/auth/lib/requireSession";
import { listAdminProducts } from "@/modules/products/lib/listAdminProducts";
import { productInputSchema } from "@/modules/products/lib/productSchemas";
import { createProduct } from "@/modules/products/lib/saveProduct";
import { jsonResponse, parseBody, routeHandler } from "@/shared/lib/api/routeHandler";
import { assertSameOrigin } from "@/shared/lib/api/sameOrigin";

// A5 product catalogue, owner only: 401 signed out, 403 staff or another
// kind of session.
export const GET = routeHandler("GET /api/admin/products", async () => {
  await requireOwnerSession();
  return jsonResponse(await listAdminProducts());
});

// A new product (AC-P1): 403 also for a cross-site request, 400 a bad body.
// On at every branch; a new category is appended to settings/catalog.
export const POST = routeHandler("POST /api/admin/products", async (request) => {
  await requireOwnerSession();
  assertSameOrigin(request);
  const input = await parseBody(productInputSchema, request);
  return jsonResponse({ product: await createProduct(input) }, 201);
});
