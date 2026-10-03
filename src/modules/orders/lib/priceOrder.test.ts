import { describe, expect, test } from "bun:test";
import type { BranchId, BranchProduct, Product, ProductId } from "@/shared/domain";
import { toIsoDate } from "@/shared/utils/pickup-dates";
import { priceOrder, type PriceOrderInput } from "./priceOrder";

const NORTHCOTE = "northcote" as BranchId;
const WED = toIsoDate("2026-09-30");
const THU = toIsoDate("2026-10-01");
const id = (value: string) => value as ProductId;

const product = (productId: string, name: string, priceCents: number, isActive = true): Product => ({
  id: id(productId),
  name,
  description: "",
  category: "Breads",
  priceCents,
  image: null,
  isActive,
});

const row = (productId: string, isAvailable: boolean, soldOutOn: string | null = null): BranchProduct => ({
  branchId: NORTHCOTE,
  productId: id(productId),
  isAvailable,
  soldOutOn: soldOutOn ? toIsoDate(soldOutOn) : null,
});

const catalog = new Map(
  [
    product("rye", "Sourdough rye loaf", 950),
    product("bagel", "Plain bagel", 280),
    product("pumpkin", "Pumpkin loaf", 800, false),
    product("fruit", "Fruit loaf", 750),
    product("seeded", "Seeded sandwich loaf", 850),
  ].map((p) => [p.id, p] as const),
);

const rows = new Map(
  [row("fruit", false), row("seeded", true, "2026-09-30"), row("bagel", true, "2026-10-01")].map(
    (r) => [r.productId, r] as const,
  ),
);

const input = (items: [string, number][], date = WED): PriceOrderInput => ({
  date,
  items: items.map(([productId, quantity]) => ({ productId: id(productId), quantity })),
  products: catalog,
  branchProducts: rows,
});

describe("priceOrder", () => {
  test("prices every line from the current price and snapshots name and unit price", () => {
    expect(priceOrder(input([["rye", 1], ["bagel", 4]]))).toEqual({
      ok: true,
      totalCents: 2070,
      items: [
        { productId: id("rye"), productName: "Sourdough rye loaf", unitPriceCents: 950, quantity: 1, lineTotalCents: 950 },
        { productId: id("bagel"), productName: "Plain bagel", unitPriceCents: 280, quantity: 4, lineTotalCents: 1120 },
      ],
    });
  });

  test("a product without a branch row is available", () => {
    const result = priceOrder(input([["rye", 2]]));
    expect(result.ok && result.totalCents).toBe(1900);
  });

  test("sold out applies only on its own date", () => {
    expect(priceOrder(input([["bagel", 1]], WED)).ok).toBe(true);
    expect(priceOrder(input([["bagel", 1]], THU))).toEqual({
      ok: false,
      unavailable: [{ productId: id("bagel"), name: "Plain bagel", reason: "sold_out" }],
    });
  });

  test("switched off at the branch, inactive and missing products are not available; each is named", () => {
    expect(priceOrder(input([["rye", 1], ["fruit", 1], ["pumpkin", 1], ["gone", 1], ["seeded", 2]]))).toEqual({
      ok: false,
      unavailable: [
        { productId: id("fruit"), name: "Fruit loaf", reason: "not_available" },
        { productId: id("pumpkin"), name: "Pumpkin loaf", reason: "not_available" },
        { productId: id("gone"), name: "gone", reason: "not_available" },
        { productId: id("seeded"), name: "Seeded sandwich loaf", reason: "sold_out" },
      ],
    });
  });

  test("switched off wins over sold out", () => {
    const branchProducts = new Map([[id("rye"), row("rye", false, "2026-09-30")]]);
    expect(priceOrder({ ...input([["rye", 1]]), branchProducts })).toEqual({
      ok: false,
      unavailable: [{ productId: id("rye"), name: "Sourdough rye loaf", reason: "not_available" }],
    });
  });
});
