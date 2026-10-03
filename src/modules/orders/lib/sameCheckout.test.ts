import { describe, expect, test } from "bun:test";
import type { BranchId, OrderItem, ProductId } from "@/shared/domain";
import { toIsoDate } from "@/shared/utils/pickup-dates";
import { isSameCheckout, type CheckoutShape } from "./sameCheckout";

const id = (value: string) => value as ProductId;
const item = (productId: string, quantity: number): OrderItem => ({
  productId: id(productId),
  productName: productId,
  unitPriceCents: 100,
  quantity,
  lineTotalCents: 100 * quantity,
});

const order = {
  branchId: "northcote" as BranchId,
  pickupDate: toIsoDate("2026-10-06"),
  paymentMethod: "at_pickup" as const,
  items: [item("rye", 1), item("bagel", 4)],
};

const request: CheckoutShape = {
  branchId: order.branchId,
  pickupDate: order.pickupDate,
  paymentMethod: "at_pickup",
  items: [
    { productId: id("bagel"), quantity: 4 },
    { productId: id("rye"), quantity: 1 },
  ],
};

describe("isSameCheckout", () => {
  test("the same branch, day, payment and items in any order", () => {
    expect(isSameCheckout(order, request)).toBe(true);
  });

  test("a different branch, day or payment method", () => {
    expect(isSameCheckout(order, { ...request, branchId: "fitzroy" as BranchId })).toBe(false);
    expect(isSameCheckout(order, { ...request, pickupDate: toIsoDate("2026-10-07") })).toBe(false);
    expect(isSameCheckout(order, { ...request, paymentMethod: "online" })).toBe(false);
  });

  test("a changed quantity, an extra item or a missing item", () => {
    expect(isSameCheckout(order, { ...request, items: [{ productId: id("rye"), quantity: 2 }, request.items[0]] })).toBe(false);
    expect(isSameCheckout(order, { ...request, items: [...request.items, { productId: id("scroll"), quantity: 1 }] })).toBe(false);
    expect(isSameCheckout(order, { ...request, items: [request.items[0]] })).toBe(false);
    expect(
      isSameCheckout(order, {
        ...request,
        items: [request.items[0], { productId: id("croissant"), quantity: 1 }],
      }),
    ).toBe(false);
  });
});
