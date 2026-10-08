import "server-only";
import { Timestamp, type UpdateData } from "firebase-admin/firestore";
import { canAccessBranch, type StaffActor } from "@/modules/auth/lib/requireSession";
import { toBranch } from "@/modules/branches/lib/toBranch";
import { collectUndoToDoc, toOrder } from "@/modules/orders/lib/toOrder";
import type { OrderDoc } from "@/modules/orders/types/orderDocs";
import type { IsoInstant, OrderId } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { getDb } from "@/shared/lib/firebase/admin";
import { branchesRef, ordersRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { paymentDashboardUrl } from "@/shared/lib/payments/paymentsConfig";
import { withDeadline } from "@/shared/utils/withDeadline";
import type { AdminOrderActionResult } from "../types/adminOrder";
import { orderNotFound } from "./getAdminOrder";
import type { OrderAction } from "./orderActionSchema";
import { isVisibleStatus } from "./paymentLabel";
import { applyChanges, type OrderChanges, planOrderAction } from "./planOrderAction";
import { toAdminOrderDetail } from "./toAdminOrder";

/** As for placing an order: a transaction can retry on contention. */
export const ORDER_ACTION_DEADLINE_MS = 8_000;

const toOptionalTimestamp = (iso: IsoInstant | null) => (iso ? Timestamp.fromDate(new Date(iso)) : null);

/** The stored fields for a plan's changes; only the keys the plan set. */
function orderChangesToDoc(changes: OrderChanges): UpdateData<OrderDoc> {
  const doc: UpdateData<OrderDoc> = {};
  if (changes.status !== undefined) doc.status = changes.status;
  if (changes.paymentStatus !== undefined) doc.paymentStatus = changes.paymentStatus;
  if (changes.paidAt !== undefined) doc.paidAt = toOptionalTimestamp(changes.paidAt);
  if (changes.readyAt !== undefined) doc.readyAt = toOptionalTimestamp(changes.readyAt);
  if (changes.collectedAt !== undefined) doc.collectedAt = toOptionalTimestamp(changes.collectedAt);
  if (changes.cancelledAt !== undefined) doc.cancelledAt = toOptionalTimestamp(changes.cancelledAt);
  if (changes.refundedAt !== undefined) doc.refundedAt = toOptionalTimestamp(changes.refundedAt);
  if (changes.cancellationReason !== undefined) doc.cancellationReason = changes.cancellationReason;
  if (changes.cancellationNote !== undefined) doc.cancellationNote = changes.cancellationNote;
  if (changes.collectUndo !== undefined) {
    doc.collectUndo = changes.collectUndo ? collectUndoToDoc(changes.collectUndo) : null;
  }
  return doc;
}

/**
 * Applies one staff action (AC-A6 to A10) in a transaction that re-reads the
 * order, so the status and branch checks and the write see the same data.
 * Another branch's order, a missing one, or one staff never see is a 404,
 * as for GET. A change made elsewhere since the staff member looked is a 409.
 */
export async function applyOrderAction(
  actor: StaffActor,
  orderId: OrderId,
  action: OrderAction,
): Promise<AdminOrderActionResult> {
  const orderRef = ordersRef().doc(orderId);

  const transaction = getDb().runTransaction(async (tx) => {
    const snapshot = await tx.get(orderRef);
    if (!snapshot.exists) throw orderNotFound();
    const order = toOrder(snapshot);
    if (!canAccessBranch(actor, order.branchId)) throw orderNotFound();
    const { status } = order;
    if (!isVisibleStatus(status)) throw orderNotFound();

    const current = { ...order, status };
    const plan = planOrderAction(current, action, new Date());
    tx.update(orderRef, orderChangesToDoc(plan.changes));
    return { order: applyChanges(current, plan.changes), undoUntil: plan.undoUntil };
  });

  // A commit that lands after the deadline did happen: the screen's refresh
  // shows it, and a repeat tap gets "already changed".
  const { order, undoUntil } = await withDeadline(
    transaction,
    ORDER_ACTION_DEADLINE_MS,
    () => new ApiError(503, "unavailable", `Order action took over ${ORDER_ACTION_DEADLINE_MS}ms`),
  );
  const branchSnapshot = await firestoreRead(branchesRef().doc(order.branchId).get(), `branches/${order.branchId}`);
  return { order: toAdminOrderDetail(order, toBranch(branchSnapshot), paymentDashboardUrl), undoUntil };
}
