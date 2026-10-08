import "server-only";
import { canAccessBranch, type StaffActor } from "@/modules/auth/lib/requireSession";
import { toBranch } from "@/modules/branches/lib/toBranch";
import { toOrder } from "@/modules/orders/lib/toOrder";
import type { OrderId } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { branchesRef, ordersRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { paymentDashboardUrl } from "@/shared/lib/payments/paymentsConfig";
import type { AdminOrderDetail } from "../types/adminOrder";
import { isVisibleStatus } from "./paymentLabel";
import { toAdminOrderDetail } from "./toAdminOrder";

export const orderNotFound = () => new ApiError(404, "not_found", "No such order");

/**
 * One order for the A3 panel. Another branch's order is a 404, the same as a
 * missing one: a 403 would confirm it exists. awaiting_payment and expired
 * orders are 404 too, as staff never see them.
 */
export async function getAdminOrder(actor: StaffActor, orderId: OrderId): Promise<AdminOrderDetail> {
  const snapshot = await firestoreRead(ordersRef().doc(orderId).get(), `orders/${orderId}`);
  if (!snapshot.exists) throw orderNotFound();
  const order = toOrder(snapshot);
  if (!canAccessBranch(actor, order.branchId)) throw orderNotFound();
  const { status } = order;
  if (!isVisibleStatus(status)) throw orderNotFound();

  const branchSnapshot = await firestoreRead(branchesRef().doc(order.branchId).get(), `branches/${order.branchId}`);
  return toAdminOrderDetail({ ...order, status }, toBranch(branchSnapshot), paymentDashboardUrl);
}
