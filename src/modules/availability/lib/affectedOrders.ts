import type { Order, ProductId } from "@/shared/domain";
import type { AffectedOrders } from "../types/availability";

// Pure: which of a day's (or the coming days') open orders include a product,
// for A4's warning. The message names a few and counts the rest.

/** How many order numbers the message names; the rest are "and N more". */
export const AFFECTED_ORDERS_NAMED = 5;

export function summariseAffectedOrders(
  orders: readonly Pick<Order, "orderNumber" | "pickupDate" | "items">[],
  productId: ProductId,
): AffectedOrders {
  const including = orders
    .filter((order) => order.items.some((item) => item.productId === productId))
    .sort((a, b) => a.pickupDate.localeCompare(b.pickupDate) || a.orderNumber.localeCompare(b.orderNumber, "en-AU", { numeric: true }));
  return {
    count: including.length,
    orderNumbers: including.slice(0, AFFECTED_ORDERS_NAMED).map((order) => order.orderNumber),
  };
}
