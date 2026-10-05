import { categorySlug, sortCategories } from "@/modules/menu/lib/buildMenu";
import { productsContent } from "../content/productsContent";
import type { AdminProduct, AdminProductsResponse } from "../types/adminProduct";

// Pure: A5's list. Categories in menu order with the products A–Z (the
// canvas has no way to reorder them), and where each product is on sale.

export interface ProductGroup {
  name: string;
  /** For the heading's ID. */
  slug: string;
  products: AdminProduct[];
  hidden: number;
}

export function groupProducts(products: readonly AdminProduct[], categories: readonly string[]): ProductGroup[] {
  const byCategory = new Map<string, AdminProduct[]>();
  for (const product of products) byCategory.set(product.category, [...(byCategory.get(product.category) ?? []), product]);
  return sortCategories([...byCategory.keys()], categories).map((name, index) => {
    const items = [...(byCategory.get(name) ?? [])].sort((a, b) => a.name.localeCompare(b.name, "en-AU"));
    return { name, slug: `${categorySlug(name)}-${index}`, products: items, hidden: items.filter((p) => !p.isActive).length };
  });
}

/** "At all 3 branches", "At 2 of 3 branches · not Fitzroy", "On no menus". */
export function productWhere(product: Pick<AdminProduct, "isActive" | "offAt">, branchCount: number): string {
  const row = productsContent.row;
  if (!product.isActive) return row.hiddenWhere;
  const on = branchCount - product.offAt.length;
  if (product.offAt.length === 0) return row.allBranches(branchCount);
  if (on <= 0) return row.noBranches;
  return row.someBranches(on, branchCount, product.offAt);
}

/** The list with one product added or replaced, and its category known (after a save). */
export function withSavedProduct(list: AdminProductsResponse, product: AdminProduct): AdminProductsResponse {
  const exists = list.products.some((p) => p.id === product.id);
  return {
    ...list,
    products: exists ? list.products.map((p) => (p.id === product.id ? product : p)) : [...list.products, product],
    categories: list.categories.includes(product.category) ? list.categories : [...list.categories, product.category],
  };
}
