import "server-only";
import { assertOrderableDate } from "@/modules/branches/lib/assertOrderableDate";
import { toBranch } from "@/modules/branches/lib/toBranch";
import type { ParsedPlaceOrderRequest } from "@/modules/checkout/lib/checkoutSchema";
import { createGuestCustomer, readCustomerIdByEmail } from "@/modules/customers/lib/guestCustomer";
import { toBranchProduct } from "@/modules/catalog/lib/toBranchProduct";
import { toProduct } from "@/modules/catalog/lib/toProduct";
import type {
  BranchProduct,
  IsoInstant,
  Order,
  OrderId,
  Product,
  ProductId,
} from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { getDb } from "@/shared/lib/firebase/admin";
import { branchesRef, branchProductsRef, ordersRef, productsRef } from "@/shared/lib/firebase/collections";
import { formatCents } from "@/shared/utils/money";
import { withDeadline } from "@/shared/utils/withDeadline";
import type { OrderConfirmation } from "../types/orderConfirmation";
import { allocateOrderNumber } from "./orderIds";
import { orderToDoc, toOrder } from "./toOrder";
import { priceOrder } from "./priceOrder";
import { toOrderConfirmation } from "./toOrderConfirmation";

/** Longer than a read's 5s: a transaction makes several round trips and may retry on contention. */
export const PLACE_ORDER_DEADLINE_MS = 8_000;

export type PlaceOrderResult =
  | { created: true; orderId: OrderId; orderNumber: string; confirmation: OrderConfirmation }
  | { created: false; orderId: OrderId; orderNumber: string };

/**
 * Places a pay-at-pickup order (AC-C7, C8) in one transaction: re-checks the
 * day with the server's clock, re-reads products and the branch's rows, prices
 * every line, takes the next order number, finds or creates the guest
 * customer, and writes the order as placed and unpaid.
 *
 * The checkout key is the order's ID, so a second request with it returns the
 * first order instead of placing another. Problems throw 4xx ApiErrors and
 * write nothing.
 */
export async function placeOrder(request: ParsedPlaceOrderRequest): Promise<PlaceOrderResult> {
  if (request.paymentMethod !== "at_pickup") {
    // Online payment has its own step (payment-provider adapter).
    throw new ApiError(422, "payment_method_unavailable", "Only pay at pickup is offered");
  }

  const orderRef = ordersRef().doc(request.checkoutKey);
  const { branchId, pickupDate, contact } = request;

  const transaction = getDb().runTransaction(async (tx): Promise<PlaceOrderResult> => {
    // Reads, all before the first write.
    const existing = await tx.get(orderRef);
    if (existing.exists) {
      const order = toOrder(existing);
      return { created: false, orderId: order.id, orderNumber: order.orderNumber };
    }

    const branchSnapshot = await tx.get(branchesRef().doc(branchId));
    if (!branchSnapshot.exists) throw new ApiError(404, "unknown_branch", `No branch "${branchId}"`);
    const branch = toBranch(branchSnapshot);
    const now = new Date();
    assertOrderableDate(branch, pickupDate, now);

    const productIds = request.items.map((item) => item.productId);
    const snapshots = await tx.getAll(
      ...productIds.map((id) => productsRef().doc(id)),
      ...productIds.map((id) => branchProductsRef(branchId).doc(id)),
    );
    const products = new Map<ProductId, Product>();
    const branchProducts = new Map<ProductId, BranchProduct>();
    for (const snapshot of snapshots.slice(0, productIds.length)) {
      if (snapshot.exists) products.set(snapshot.id as ProductId, toProduct(snapshot));
    }
    for (const snapshot of snapshots.slice(productIds.length)) {
      if (snapshot.exists) branchProducts.set(snapshot.id as ProductId, toBranchProduct(snapshot));
    }

    const priced = priceOrder({ date: pickupDate, items: request.items, products, branchProducts });
    if (!priced.ok) {
      throw new ApiError(409, "items_unavailable", "Some items can't be ordered for that branch and day", {
        items: priced.unavailable,
      });
    }
    if (priced.totalCents !== request.expectedTotalCents) {
      throw new ApiError(
        409,
        "price_changed",
        `Total is ${formatCents(priced.totalCents)}, not ${formatCents(request.expectedTotalCents)}`,
        { totalCents: priced.totalCents },
      );
    }

    const existingCustomerId = await readCustomerIdByEmail(tx, contact.email);
    const orderNumber = await allocateOrderNumber(tx);

    // Writes. An existing customer is only linked, never changed.
    const customerId = existingCustomerId ?? createGuestCustomer(tx, contact, now);
    const order: Omit<Order, "id"> = {
      orderNumber,
      branchId,
      customerId,
      contactName: contact.name,
      contactPhone: contact.phone,
      contactEmail: contact.email,
      pickupDate,
      status: "placed",
      notes: request.notes,
      items: priced.items,
      totalCents: priced.totalCents,
      paymentMethod: "at_pickup",
      paymentStatus: "unpaid",
      paymentRef: null,
      processedStripeEventIds: [],
      recurringOrderId: null,
      generationNote: null,
      cancellationReason: null,
      createdAt: now.toISOString() as IsoInstant,
      paidAt: null,
      refundedAt: null,
      readyAt: null,
      collectedAt: null,
      cancelledAt: null,
    };
    tx.create(orderRef, orderToDoc(order));

    const orderId = orderRef.id as OrderId;
    return {
      created: true,
      orderId,
      orderNumber,
      confirmation: toOrderConfirmation({ id: orderId, ...order }, branch),
    };
  });

  // A commit that lands after the deadline is safe: the browser's retry with
  // the same key gets that order back.
  return withDeadline(
    transaction,
    PLACE_ORDER_DEADLINE_MS,
    () => new ApiError(503, "unavailable", `Placing an order took over ${PLACE_ORDER_DEADLINE_MS}ms`),
  );
}
