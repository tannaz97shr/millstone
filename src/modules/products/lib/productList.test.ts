import { describe, expect, test } from "bun:test";
import type { AdminProduct, AdminProductsResponse } from "../types/adminProduct";
import { groupProducts, productWhere, withSavedProduct } from "./productList";

const product = (id: string, category: string, name: string, extra: Partial<AdminProduct> = {}): AdminProduct =>
  ({ id, category, name, description: "", priceCents: 500, imageUrl: null, isActive: true, version: 0, offAt: [], ...extra }) as AdminProduct;

describe("groupProducts", () => {
  test("menu category order, products A–Z, hidden counted", () => {
    const groups = groupProducts(
      [
        product("w", "Breads", "White sourdough"),
        product("p", "Breads", "Pumpkin loaf", { isActive: false }),
        product("b", "Bagels", "Plain bagel"),
        product("s", "Savoury", "Olive fougasse"),
      ],
      ["Breads", "Pastries", "Bagels"],
    );
    expect(groups.map((g) => g.name)).toEqual(["Breads", "Bagels", "Savoury"]);
    expect(groups[0].products.map((p) => p.name)).toEqual(["Pumpkin loaf", "White sourdough"]);
    expect(groups[0].hidden).toBe(1);
    expect(groups[0].slug).toBe("breads-0");
  });
});

describe("productWhere", () => {
  test("the canvas's wording", () => {
    expect(productWhere({ isActive: true, offAt: [] }, 3)).toBe("At all 3 branches");
    expect(productWhere({ isActive: true, offAt: ["Fitzroy"] }, 3)).toBe("At 2 of 3 branches · not Fitzroy");
    expect(productWhere({ isActive: true, offAt: ["Fitzroy", "Brunswick"] }, 3)).toBe("At 1 of 3 branches · not Fitzroy, Brunswick");
    expect(productWhere({ isActive: false, offAt: ["Fitzroy"] }, 3)).toBe("On no menus");
    expect(productWhere({ isActive: true, offAt: ["A", "B", "C"] }, 3)).toBe("Switched off at every branch");
  });
});

describe("withSavedProduct", () => {
  const list: AdminProductsResponse = { products: [product("w", "Breads", "White")], categories: ["Breads"], branchCount: 3 };

  test("replaces a saved product", () => {
    const next = withSavedProduct(list, product("w", "Breads", "White", { priceCents: 900 }));
    expect(next.products).toHaveLength(1);
    expect(next.products[0].priceCents).toBe(900);
  });

  test("adds a new one and its new category", () => {
    const next = withSavedProduct(list, product("o", "Savoury", "Olive fougasse"));
    expect(next.products.map((p) => p.id)).toEqual(["w", "o"]);
    expect(next.categories).toEqual(["Breads", "Savoury"]);
  });
});
