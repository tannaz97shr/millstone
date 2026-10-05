import { requireOwnerSession } from "@/modules/auth/lib/requireSession";
import { productIdParam } from "@/modules/catalog/lib/productParams";
import { productUpdateSchema } from "@/modules/products/lib/productSchemas";
import { productNotFound, updateProduct } from "@/modules/products/lib/saveProduct";
import { jsonResponse, parseBody, routeHandler } from "@/shared/lib/api/routeHandler";
import { assertSameOrigin } from "@/shared/lib/api/sameOrigin";

// Edit a product (AC-P1 to P3), hide or show it, owner only. 401 signed out,
// 403 staff or a cross-site request, 400 a bad body, 404 no such product,
// 409 saved on another screen since the form read it (product_changed).
export const PATCH = routeHandler(
  "PATCH /api/admin/products/[productId]",
  async (request, { params }: { params: Promise<{ productId: string }> }) => {
    await requireOwnerSession();
    assertSameOrigin(request);
    const parsed = productIdParam.safeParse((await params).productId);
    if (!parsed.success) throw productNotFound();
    const { expectedVersion, ...input } = await parseBody(productUpdateSchema, request);
    return jsonResponse({ product: await updateProduct(parsed.data, input, expectedVersion) });
  },
);
