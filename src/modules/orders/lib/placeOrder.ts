import "server-only";
import { assertOrderableDate } from "@/modules/branches/lib/assertOrderableDate";
import { toBranch } from "@/modules/branches/lib/toBranch";
import type { ParsedPlaceOrderRequest } from "@/modules/checkout/lib/checkoutSchema";
import { createGuestCustomer, readCustomerIdByEmail } from "@/modules/customers/lib/guestCustomer";
import { toBranchProduct } from "@/modules/catalog/lib/toBranchProduct";
import { toProduct } from "@/modules/catalog/lib/toProduct";
import type {
  Branch,
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
import { onlinePaymentsEnabled } from "@/shared/lib/payments/paymentsConfig";
import { formatCents } from "@/shared/utils/money";
import { withDeadline } from "@/shared/utils/withDeadline";
import { allocateOrderNumber } from "./orderIds";
import { paymentExpiresAtFor } from "./payment/paymentWindow";
import { planCheckoutRetry } from "./payment/planCheckoutRetry";
import { orderToDoc, toOrder } from "./toOrder";
import { priceOrder } from "./priceOrder";
import { isSameCheckout } from "./sameCheckout";

/** Longer than a read's 5s: a transaction makes several round trips and may retry on contention. */
export const PLACE_ORDER_DEADLINE_MS = 8_000;

export type PlaceOrderResult =
  /** Saved now (`created`), or the checkout key's order from an earlier try (`existing`). */
  | { outcome: "created" | "existing"; order: Order; branch: Branch }
  /** The key's online order was never paid and can't be reused: nothing new is saved. */
  | { outcome: "abandoned"; order: Order };

/**
 * Places an order (AC-C6, C7, C8) in one transaction: re-checks the day with
 * the server's clock, re-reads products and the branch's rows, prices every
 * line, takes the next order number, finds or creates the guest customer,
 * and writes the order. Pay at pickup is placed and unpaid; online waits for
 * payment (awaiting_payment, hidden from staff) until the provider's webhook
 * says it's paid. The payment page itself is opened afterwards
 * (startOnlinePayment), outside the transaction.
 *
 * The checkout key is the order's ID, so a second request with it returns the
 * first order instead of placing another (planCheckoutRetry has the cases).
 * Problems throw 4xx ApiErrors and write nothing.
 */
export async function placeOrder(request: ParsedPlaceOrderRequest): Promise<PlaceOrderResult> {
  if (request.paymentMethod === "online" && !onlinePaymentsEnabled()) {
    throw new ApiError(422, "payment_method_unavailable", "Online payment is switched off");
  }

  const orderRef = ordersRef().doc(request.checkoutKey);
  const { branchId, pickupDate, contact } = request;
  const now = new Date();

  const transaction = getDb().runTransaction(async (tx): Promise<PlaceOrderResult> => {
    // Reads, all before the first write.
    const existing = await tx.get(orderRef);
    if (existing.exists) {
      const order = toOrder(existing);
      const retry = planCheckoutRetry(order, isSameCheckout(order, request), now);
      if (retry.kind === "mismatch") {
        throw new ApiError(
          409,
          "checkout_key_mismatch",
          `Checkout key already placed ${order.orderNumber}, a different order`,
          { existingOrder: { orderId: order.id, orderNumber: order.orderNumber } },
        );
      }
      if (retry.kind === "abandoned") {
        if (!retry.expireNow) return { outcome: "abandoned", order };
        tx.update(orderRef, { status: "expired" });
        return { outcome: "abandoned", order: { ...order, status: "expired" } };
      }
      const branchSnapshot = await tx.get(branchesRef().doc(order.branchId));
      if (!branchSnapshot.exists) throw new ApiError(404, "unknown_branch", `No branch "${order.branchId}"`);
      return { outcome: "existing", order, branch: toBranch(branchSnapshot) };
    }

    const branchSnapshot = await tx.get(branchesRef().doc(branchId));
    if (!branchSnapshot.exists) throw new ApiError(404, "unknown_branch", `No branch "${branchId}"`);
    const branch = toBranch(branchSnapshot);
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
    const online = request.paymentMethod === "online";
    const order: Order = {
      id: orderRef.id as OrderId,
      orderNumber,
      branchId,
      customerId,
      contactName: contact.name,
      contactPhone: contact.phone,
      contactEmail: contact.email,
      pickupDate,
      status: online ? "awaiting_payment" : "placed",
      notes: request.notes,
      items: priced.items,
      totalCents: priced.totalCents,
      paymentMethod: request.paymentMethod,
      paymentStatus: "unpaid",
      paymentRef: null,
      processedStripeEventIds: [],
      checkoutSessionId: null,
      paymentExpiresAt: online ? paymentExpiresAtFor(now) : null,
      recurringOrderId: null,
      generationNote: null,
      cancellationReason: null,
      cancellationNote: null,
      collectUndo: null,
      createdAt: now.toISOString() as IsoInstant,
      paidAt: null,
      refundedAt: null,
      readyAt: null,
      collectedAt: null,
      cancelledAt: null,
    };
    tx.create(orderRef, orderToDoc(order));
    return { outcome: "created", order, branch };
  });

  // A commit that lands after the deadline is safe: the browser's retry with
  // the same key gets that order back.
  return withDeadline(
    transaction,
    PLACE_ORDER_DEADLINE_MS,
    () => new ApiError(503, "unavailable", `Placing an order took over ${PLACE_ORDER_DEADLINE_MS}ms`),
  );
}
