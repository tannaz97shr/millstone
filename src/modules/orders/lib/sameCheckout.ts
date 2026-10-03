import type { BranchId, IsoDate, Order, PaymentMethod, ProductId } from "@/shared/domain";

/** What a checkout asks for, as far as deciding whether a repeat is the same order. */
export interface CheckoutShape {
  branchId: BranchId;
  pickupDate: IsoDate;
  paymentMethod: PaymentMethod;
  items: readonly { productId: ProductId; quantity: number }[];
}

/**
 * True when a request with an order's checkout key asks for that same order:
 * same branch, pickup date, payment method, and products with the same
 * quantities (in any order). Contact details and notes don't count, so a
 * retry after fixing a typo still returns the order that was placed.
 */
export function isSameCheckout(order: Pick<Order, keyof CheckoutShape>, request: CheckoutShape): boolean {
  if (
    order.branchId !== request.branchId ||
    order.pickupDate !== request.pickupDate ||
    order.paymentMethod !== request.paymentMethod ||
    order.items.length !== request.items.length
  ) {
    return false;
  }
  const quantities = new Map(order.items.map((item) => [item.productId, item.quantity]));
  return request.items.every((item) => quantities.get(item.productId) === item.quantity);
}
