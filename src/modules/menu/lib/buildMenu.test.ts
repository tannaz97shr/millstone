import { describe, expect, test } from "bun:test";
import type { BranchId, BranchProduct, Product, ProductId } from "@/shared/domain";
import { toIsoDate } from "@/shared/utils/pickup-dates";
import { buildMenu, categorySlug, sortCategories } from "./buildMenu";

const NORTHCOTE = "northcote" as BranchId;
const WED = toIsoDate("2026-09-30");
const THU = toIsoDate("2026-10-01");

const product = (id: string, category: string, name: string, isActive = true): Product => ({
  id: id as ProductId,
  name,
  description: `${name} description`,
  category,
  priceCents: 500,
  image: null,
  isActive,
});

const row = (id: string, isAvailable: boolean, soldOutOn: string | null = null): BranchProduct => ({
  branchId: NORTHCOTE,
  productId: id as ProductId,
  isAvailable,
  soldOutOn: soldOutOn ? toIsoDate(soldOutOn) : null,
});

const products = [
  product("plain-bagel", "Bagels", "Plain bagel"),
  product("rye", "Breads", "Sourdough rye loaf"),
  product("croissant", "Pastries", "Butter croissant"),
  product("fruit", "Breads", "Fruit loaf"),
  product("pumpkin", "Breads", "Pumpkin loaf", false),
  product("brownie", "Cakes", "Brownie"),
  product("anzac", "Biscuits", "Anzac biscuit"),
];

const ORDER = ["Breads", "Pastries", "Bagels"];

const names = (menu: ReturnType<typeof buildMenu>) =>
  menu.categories.map((c) => [c.name, c.products.map((p) => p.name)]);

describe("buildMenu", () => {
  test("listed categories in stored order, unlisted ones last A–Z, products A–Z", () => {
    const menu = buildMenu({ branchId: NORTHCOTE, date: WED, products, branchProducts: [], categoryOrder: ORDER });
    expect(names(menu)).toEqual([
      ["Breads", ["Fruit loaf", "Sourdough rye loaf"]],
      ["Pastries", ["Butter croissant"]],
      ["Bagels", ["Plain bagel"]],
      ["Biscuits", ["Anzac biscuit"]],
      ["Cakes", ["Brownie"]],
    ]);
  });

  test("inactive products are never on the menu, even with an available row", () => {
    const menu = buildMenu({
      branchId: NORTHCOTE,
      date: WED,
      products,
      branchProducts: [row("pumpkin", true)],
      categoryOrder: ORDER,
    });
    expect(menu.categories.flatMap((c) => c.products.map((p) => p.id))).not.toContain("pumpkin" as ProductId);
  });

  test("a product switched off at the branch is left out; a missing row means available", () => {
    const menu = buildMenu({
      branchId: NORTHCOTE,
      date: WED,
      products,
      branchProducts: [row("rye", false)],
      categoryOrder: ORDER,
    });
    expect(menu.categories[0].products.map((p) => p.name)).toEqual(["Fruit loaf"]);
  });

  test("a category with nothing left on the menu is dropped", () => {
    const menu = buildMenu({
      branchId: NORTHCOTE,
      date: WED,
      products,
      branchProducts: [row("croissant", false)],
      categoryOrder: ORDER,
    });
    expect(menu.categories.map((c) => c.name)).not.toContain("Pastries");
  });

  test("sold out only on its own date", () => {
    const input = {
      branchId: NORTHCOTE,
      products,
      branchProducts: [row("fruit", true, "2026-09-30")],
      categoryOrder: ORDER,
    };
    const fruitOn = (menu: ReturnType<typeof buildMenu>) =>
      menu.categories[0].products.find((p) => p.id === ("fruit" as ProductId))?.soldOut;
    expect(fruitOn(buildMenu({ ...input, date: WED }))).toBe(true);
    expect(fruitOn(buildMenu({ ...input, date: THU }))).toBe(false);
  });

  test("no category order at all: everything A–Z", () => {
    const menu = buildMenu({ branchId: NORTHCOTE, date: WED, products, branchProducts: [], categoryOrder: [] });
    expect(menu.categories.map((c) => c.name)).toEqual(["Bagels", "Biscuits", "Breads", "Cakes", "Pastries"]);
  });

  test("carries the branch, date and image URL through", () => {
    const withImage: Product = {
      ...product("photo", "Breads", "Photo loaf"),
      image: { path: "products/photo.jpg", url: "https://example.com/photo.jpg" },
    };
    const menu = buildMenu({ branchId: NORTHCOTE, date: WED, products: [withImage], branchProducts: [], categoryOrder: ORDER });
    expect(menu.branchId).toBe(NORTHCOTE);
    expect(menu.date).toBe(WED);
    expect(menu.categories[0].products[0].imageUrl).toBe("https://example.com/photo.jpg");
  });
});

describe("sortCategories", () => {
  test("ignores listed categories that have no products and removes duplicates", () => {
    expect(sortCategories(["Bagels", "Breads", "Bagels"], ["Pastries", "Breads", "Bagels"])).toEqual([
      "Breads",
      "Bagels",
    ]);
  });
});

describe("categorySlug", () => {
  test("lowercase words joined by dashes", () => {
    expect(categorySlug("Breads")).toBe("breads");
    expect(categorySlug("Cakes & tarts")).toBe("cakes-tarts");
    expect(categorySlug("  Gluten-free!  ")).toBe("gluten-free");
  });

  test("accents are dropped, not turned into dashes", () => {
    expect(categorySlug("Crème tarts")).toBe("creme-tarts");
  });

  test("a name with no letters or digits still gets a slug", () => {
    expect(categorySlug("&&")).toBe("category");
  });

  test("slugs stay unique within a menu", () => {
    const menu = buildMenu({
      branchId: NORTHCOTE,
      date: WED,
      products: [product("a", "Cakes & tarts", "A"), product("b", "Cakes, tarts", "B")],
      branchProducts: [],
      categoryOrder: [],
    });
    expect(menu.categories.map((c) => c.slug)).toEqual(["cakes-tarts", "cakes-tarts-2"]);
  });
});
