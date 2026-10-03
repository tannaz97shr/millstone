import "server-only";
import { toBranch } from "@/modules/branches/lib/toBranch";
import type { OrderId } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { branchesRef, ordersRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import type { OrderConfirmation } from "../types/orderConfirmation";
import { toOrder } from "./toOrder";
import { toOrderConfirmation } from "./toOrderConfirmation";

const notFound = () => new ApiError(404, "not_found", "No such order");

/**
 * What C7 shows for one order (GET /api/orders/{orderId}, and the server
 * prefetch). An order still waiting for payment, or expired, isn't confirmed,
 * so it's a 404 like a missing one.
 */
export async function getOrderConfirmation(orderId: OrderId): Promise<OrderConfirmation> {
  const snapshot = await firestoreRead(ordersRef().doc(orderId).get(), `orders/${orderId}`);
  if (!snapshot.exists) throw notFound();
  const order = toOrder(snapshot);
  if (order.status === "awaiting_payment" || order.status === "expired") throw notFound();

  const branchSnapshot = await firestoreRead(
    branchesRef().doc(order.branchId).get(),
    `branches/${order.branchId}`,
  );
  return toOrderConfirmation(order, toBranch(branchSnapshot));
}
