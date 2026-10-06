import "server-only";
import { toBranch } from "@/modules/branches/lib/toBranch";
import type { Order, OrderId } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { getDb } from "@/shared/lib/firebase/admin";
import { branchesRef, ordersRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { logError } from "@/shared/utils/logError";
import { withDeadline } from "@/shared/utils/withDeadline";
import type { OrderConfirmation } from "../types/orderConfirmation";
import { isLazilyExpired } from "./payment/paymentWindow";
import { toOrder } from "./toOrder";
import { toOrderConfirmation } from "./toOrderConfirmation";

const notFound = () => new ApiError(404, "not_found", "No such order");

const EXPIRE_DEADLINE_MS = 5_000;

/**
 * Writes `expired` on an order whose payment page was never opened, now that
 * its hour is up (spec 6). Re-checked in the transaction. A failure is only
 * logged: the order is shown as expired either way, and is tried again next read.
 */
async function expireStaleOrder(order: Order, now: Date): Promise<void> {
  const ref = ordersRef().doc(order.id);
  try {
    await withDeadline(
      getDb().runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        if (snapshot.exists && isLazilyExpired(toOrder(snapshot), now)) tx.update(ref, { status: "expired" });
      }),
      EXPIRE_DEADLINE_MS,
      () => new Error(`Expiring ${order.orderNumber} took over ${EXPIRE_DEADLINE_MS}ms`),
    );
  } catch (error) {
    logError(error, `expireStaleOrder ${order.orderNumber}`, { level: "warn" });
  }
}

/**
 * What C6 and C7 show for one order (GET /api/orders/{orderId}, and the
 * server prefetch), with `state` saying whether it's placed, still waiting
 * for payment, or expired unpaid.
 */
export async function getOrderConfirmation(orderId: OrderId, now = new Date()): Promise<OrderConfirmation> {
  const snapshot = await firestoreRead(ordersRef().doc(orderId).get(), `orders/${orderId}`);
  if (!snapshot.exists) throw notFound();
  let order = toOrder(snapshot);
  if (isLazilyExpired(order, now)) {
    await expireStaleOrder(order, now);
    order = { ...order, status: "expired" };
  }

  const branchSnapshot = await firestoreRead(
    branchesRef().doc(order.branchId).get(),
    `branches/${order.branchId}`,
  );
  return toOrderConfirmation(order, toBranch(branchSnapshot));
}
