import type { Cents, ProductId } from "@/shared/domain";

/** One product as A5 shows and edits it. */
export interface AdminProduct {
  id: ProductId;
  name: string;
  description: string;
  category: string;
  priceCents: Cents;
  /** Token-gated download URL, or null for the letter placeholder. */
  imageUrl: string | null;
  isActive: boolean;
  /** Sent back on save; a different version on the server is a 409. */
  version: number;
  /** Names of the branches that have switched it off, in C1's order. */
  offAt: string[];
}

/** GET /api/admin/products */
export interface AdminProductsResponse {
  products: AdminProduct[];
  /** Every category in menu order (settings/catalog first, then any others A–Z). */
  categories: string[];
  branchCount: number;
}

/** POST /api/admin/products, PATCH /api/admin/products/{id}, POST …/photo */
export interface AdminProductResult {
  product: AdminProduct;
}
