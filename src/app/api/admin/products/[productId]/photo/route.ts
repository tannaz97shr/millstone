import { requireOwnerSession } from "@/modules/auth/lib/requireSession";
import { productIdParam } from "@/modules/catalog/lib/productParams";
import { PHOTO_BODY_MAX_BYTES } from "@/modules/products/lib/photoRules";
import { readPhotoForm } from "@/modules/products/lib/productPhotoForm";
import { productNotFound } from "@/modules/products/lib/saveProduct";
import { setProductPhoto } from "@/modules/products/lib/setProductPhoto";
import { parseMultipart, readLimitedBody } from "@/shared/lib/api/readLimitedBody";
import { jsonResponse, routeHandler } from "@/shared/lib/api/routeHandler";
import { assertSameOrigin } from "@/shared/lib/api/sameOrigin";

// A product's photo (multipart: file + expectedVersion), owner only.
// 401 signed out, 403 staff or a cross-site request, 400 a bad body, 404 no
// such product, 409 saved elsewhere since, 413 over 4 MB (refused before the
// body is read in full; Vercel's own limit is 4.5 MB), 415 not a JPEG, PNG or
// WebP by its bytes, 422 too small.
export const POST = routeHandler(
  "POST /api/admin/products/[productId]/photo",
  async (request, { params }: { params: Promise<{ productId: string }> }) => {
    await requireOwnerSession();
    assertSameOrigin(request);
    const parsed = productIdParam.safeParse((await params).productId);
    if (!parsed.success) throw productNotFound();
    const form = await parseMultipart(request, await readLimitedBody(request, PHOTO_BODY_MAX_BYTES));
    const { bytes, expectedVersion } = await readPhotoForm(form);
    return jsonResponse({ product: await setProductPhoto(parsed.data, bytes, expectedVersion) });
  },
);
