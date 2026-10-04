import type { BranchId, BranchProduct, IsoDate, Product, ProductId } from "@/shared/domain";
import { isSoldOut } from "@/shared/utils/pickup-dates";
import type { BranchMenu, MenuCategory, MenuProduct } from "../types/menu";

// Pure: turns the catalog, one branch's availability rows and the category
// order into the menu for one pickup date. No Firestore, no clock.

export interface BuildMenuInput {
  branchId: BranchId;
  date: IsoDate;
  products: readonly Product[];
  /** Rows for this branch. A product with no row is available (the default). */
  branchProducts: readonly BranchProduct[];
  categoryOrder: readonly string[];
}

/** "Breads" → "breads", "Cakes & tarts" → "cakes-tarts", "Crème tarts" → "creme-tarts". */
export function categorySlug(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // accents split off by NFKD: "è" → "e"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "category";
}

/** Spec AC-C1: on the menu when the product is active and the branch hasn't switched it off. */
export function isOnMenu(product: Product, branchProduct: BranchProduct | undefined): boolean {
  return product.isActive && (branchProduct?.isAvailable ?? true);
}

/** Listed categories first in their stored order, then any others A–Z. */
export function sortCategories(names: readonly string[], categoryOrder: readonly string[]): string[] {
  const rank = new Map(categoryOrder.map((name, index) => [name, index]));
  return [...new Set(names)].sort((a, b) => {
    const rankA = rank.get(a) ?? Number.POSITIVE_INFINITY;
    const rankB = rank.get(b) ?? Number.POSITIVE_INFINITY;
    if (rankA !== rankB) return rankA - rankB;
    return a.localeCompare(b, "en-AU");
  });
}

export function buildMenu({
  branchId,
  date,
  products,
  branchProducts,
  categoryOrder,
}: BuildMenuInput): BranchMenu {
  const rows = new Map<ProductId, BranchProduct>(branchProducts.map((row) => [row.productId, row]));

  const byCategory = new Map<string, MenuProduct[]>();
  for (const product of products) {
    const row = rows.get(product.id);
    if (!isOnMenu(product, row)) continue;
    const items = byCategory.get(product.category) ?? [];
    items.push({
      id: product.id,
      name: product.name,
      description: product.description,
      priceCents: product.priceCents,
      imageUrl: product.image?.url ?? null,
      soldOut: row ? isSoldOut(row, date) : false,
    });
    byCategory.set(product.category, items);
  }

  const usedSlugs = new Set<string>();
  const categories: MenuCategory[] = sortCategories([...byCategory.keys()], categoryOrder).map(
    (name) => {
      // Two names that only differ in punctuation would share a slug.
      const base = categorySlug(name);
      let slug = base;
      for (let n = 2; usedSlugs.has(slug); n++) slug = `${base}-${n}`;
      usedSlugs.add(slug);
      const items = byCategory.get(name) ?? [];
      return {
        name,
        slug,
        products: items.sort((a, b) => a.name.localeCompare(b.name, "en-AU")),
      };
    },
  );

  return { branchId, date, categories };
}
