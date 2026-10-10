import "server-only";
import { planAccountFromOrder } from "@/modules/account/lib/planAccountFromOrder";
import { toBranch } from "@/modules/branches/lib/toBranch";
import { findCustomerByEmail, findCustomerById } from "@/modules/customers/lib/findCustomer";
import type { CustomerId, Order, OrderId } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { getDb } from "@/shared/lib/firebase/admin";
import { branchesRef, ordersRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { logError } from "@/shared/utils/logError";
import { withDeadline } from "@/shared/utils/withDeadline";
import type { OrderConfirmationView } from "../types/orderConfirmation";
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
 * Whether C7 offers a guest "Save your details" for this order. Reads the
 * order's customer, and who owns its email now, only when it could apply.
 */
async function accountOfferFor(order: Order, viewerSignedIn: boolean, now: Date): Promise<boolean> {
  if (viewerSignedIn || order.accountId !== null || order.customerId === null) return false;
  const customer = await findCustomerById(order.customerId);
  const owner = customer ? await findCustomerByEmail(customer.email) : null;
  const plan = planAccountFromOrder({
    order,
    customer: customer && { passwordHash: customer.passwordHash, ownsEmail: owner?.id === customer.id },
    now,
  });
  return plan.kind === "offer";
}

/**
 * What C6 and C7 show for one order (GET /api/orders/{orderId}, and the
 * server prefetch), with `state` saying whether it's placed, still waiting
 * for payment, or expired unpaid. `viewer`: the signed-in customer looking,
 * or null. A signed-in viewer gets no account offer, and is told whether the
 * order is in their own account.
 */
export async function getOrderConfirmation(
  orderId: OrderId,
  viewer: CustomerId | null,
  now = new Date(),
): Promise<OrderConfirmationView> {
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
  const accountOffer = await accountOfferFor(order, viewer !== null, now);
  const inViewersAccount = viewer !== null && order.accountId === viewer;
  return { ...toOrderConfirmation(order, toBranch(branchSnapshot)), accountOffer, inViewersAccount };
}
