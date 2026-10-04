import { categorySlug, sortCategories } from "@/modules/menu/lib/buildMenu";
import type { BranchProduct, IsoDate, Product, ProductId } from "@/shared/domain";
import type { AvailabilityCategory, AvailabilityProduct } from "../types/availability";
import { availabilityState } from "./availabilityRules";

// Pure: A4's list for one branch. Every active product, grouped in the menu's
// category order and A–Z inside each, whether or not this branch has it on.

export interface BuildAvailabilityInput {
  products: readonly Product[];
  /** This branch's rows. A product with no row is on the menu. */
  branchProducts: readonly BranchProduct[];
  categoryOrder: readonly string[];
  today: IsoDate;
}

export function buildAvailability({
  products,
  branchProducts,
  categoryOrder,
  today,
}: BuildAvailabilityInput): AvailabilityCategory[] {
  const rows = new Map<ProductId, BranchProduct>(branchProducts.map((row) => [row.productId, row]));
  const byCategory = new Map<string, AvailabilityProduct[]>();
  for (const product of products) {
    if (!product.isActive) continue;
    const items = byCategory.get(product.category) ?? [];
    items.push({ id: product.id, name: product.name, state: availabilityState(rows.get(product.id), today) });
    byCategory.set(product.category, items);
  }

  const usedSlugs = new Set<string>();
  return sortCategories([...byCategory.keys()], categoryOrder).map((name) => {
    const base = categorySlug(name);
    let slug = base;
    for (let n = 2; usedSlugs.has(slug); n++) slug = `${base}-${n}`;
    usedSlugs.add(slug);
    const items = byCategory.get(name) ?? [];
    return { name, slug, products: items.sort((a, b) => a.name.localeCompare(b.name, "en-AU")) };
  });
}
