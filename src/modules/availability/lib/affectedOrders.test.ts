import { describe, expect, test } from "bun:test";
import type { IsoDate, Order, OrderItem, ProductId } from "@/shared/domain";
import { availabilityContent } from "../content/availabilityContent";
import { AFFECTED_ORDERS_NAMED, summariseAffectedOrders } from "./affectedOrders";

const bagel = "plain-bagel" as ProductId;
const item = (productId: string) => ({ productId }) as OrderItem;
const order = (n: number, pickupDate: string, productIds: string[]) =>
  ({ orderNumber: `MS-${n}`, pickupDate: pickupDate as IsoDate, items: productIds.map(item) }) as Pick<
    Order,
    "orderNumber" | "pickupDate" | "items"
  >;

describe("summariseAffectedOrders", () => {
  test("only orders including the product, earliest day first, then by number", () => {
    const result = summariseAffectedOrders(
      [
        order(1044, "2026-10-07", ["plain-bagel"]),
        order(1999, "2026-10-06", ["plain-bagel", "fruit-loaf"]),
        order(1040, "2026-10-06", ["fruit-loaf"]),
        order(10001, "2026-10-06", ["plain-bagel"]),
      ],
      bagel,
    );
    expect(result).toEqual({ count: 3, orderNumbers: ["MS-1999", "MS-10001", "MS-1044"] });
  });

  test(`names at most ${AFFECTED_ORDERS_NAMED} and counts the rest`, () => {
    const orders = Array.from({ length: 12 }, (_, i) => order(1040 + i, "2026-10-06", ["plain-bagel"]));
    const result = summariseAffectedOrders(orders, bagel);
    expect(result.count).toBe(12);
    expect(result.orderNumbers).toEqual(["MS-1040", "MS-1041", "MS-1042", "MS-1043", "MS-1044"]);
  });

  test("none", () => {
    expect(summariseAffectedOrders([order(1040, "2026-10-06", ["fruit-loaf"])], bagel)).toEqual({
      count: 0,
      orderNumbers: [],
    });
  });
});

describe("the warning's wording", () => {
  const { affectedOnDay, affectedUpcoming } = availabilityContent.messages;

  test("lists every number up to five", () => {
    expect(affectedOnDay(3, ["MS-1040", "MS-1042", "MS-1044"], "Tue 6 Oct")).toBe(
      "3 orders for Tue 6 Oct already have it: MS-1040, MS-1042 and MS-1044. Those orders stay as placed, so call the customers if you can’t make it.",
    );
    expect(affectedOnDay(1, ["MS-1045"], "Wed 7 Oct")).toBe(
      "1 order for Wed 7 Oct already has it: MS-1045. That order stays as placed, so call the customer if you can’t make it.",
    );
  });

  test("past five: the first five, then “and N more”", () => {
    const named = ["MS-1040", "MS-1041", "MS-1042", "MS-1043", "MS-1044"];
    expect(affectedOnDay(12, named, "Tue 6 Oct")).toBe(
      "12 orders for Tue 6 Oct already have it: MS-1040, MS-1041, MS-1042, MS-1043, MS-1044 and 7 more. Those orders stay as placed, so call the customers if you can’t make it.",
    );
    expect(affectedUpcoming(6, named)).toStartWith(
      "6 orders still to collect already have it: MS-1040, MS-1041, MS-1042, MS-1043, MS-1044 and 1 more.",
    );
  });
});
