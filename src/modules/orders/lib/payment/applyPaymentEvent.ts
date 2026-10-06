import "server-only";
import { FieldValue, Timestamp, type UpdateData } from "firebase-admin/firestore";
import { toBranch } from "@/modules/branches/lib/toBranch";
import type { Order } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { getDb } from "@/shared/lib/firebase/admin";
import { branchesRef, ordersRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { logError } from "@/shared/utils/logError";
import { withDeadline } from "@/shared/utils/withDeadline";
import type { OrderConfirmation } from "../../types/orderConfirmation";
import type { OrderDoc } from "../../types/orderDocs";
import { toOrder } from "../toOrder";
import { toOrderConfirmation } from "../toOrderConfirmation";
import {
  type ActionablePaymentEvent,
  type PaymentEventChanges,
  type PaymentEventOutcome,
  planPaymentEvent,
} from "./planPaymentEvent";

const APPLY_EVENT_DEADLINE_MS = 8_000;

export interface AppliedPaymentEvent {
  outcome: PaymentEventOutcome | "unknown_order";
  orderNumber: string | null;
  /** Set when the order just became paid: the email to send (AC-C9). */
  confirmation: OrderConfirmation | null;
}

function changesToDoc(changes: PaymentEventChanges, eventId: string): UpdateData<OrderDoc> {
  const doc: UpdateData<OrderDoc> = { processedStripeEventIds: FieldValue.arrayUnion(eventId) };
  if (changes.status !== undefined) doc.status = changes.status;
  if (changes.paymentStatus !== undefined) doc.paymentStatus = changes.paymentStatus;
  if (changes.paymentRef !== undefined) doc.paymentRef = changes.paymentRef;
  if (changes.paidAt !== undefined) doc.paidAt = changes.paidAt ? Timestamp.fromDate(new Date(changes.paidAt)) : null;
  return doc;
}

/**
 * Applies one verified payment event (spec 6, AC-C6) in a transaction that
 * re-reads the order, so duplicates and events racing each other are decided
 * on the stored state. A Firestore failure throws, so the route answers 5xx
 * and the provider sends the event again later; that's safe for the same reason.
 */
export async function applyPaymentEvent(event: ActionablePaymentEvent, now: Date): Promise<AppliedPaymentEvent> {
  const ref = ordersRef().doc(event.orderId);

  const transaction = getDb().runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) return null;
    const order = toOrder(snapshot);
    const plan = planPaymentEvent(order, event, now);
    if (plan.record) tx.update(ref, changesToDoc(plan.changes, event.eventId));
    const updated: Order = { ...order, ...plan.changes };
    return { order: updated, plan };
  });

  const result = await withDeadline(
    transaction,
    APPLY_EVENT_DEADLINE_MS,
    () => new ApiError(503, "unavailable", `Applying ${event.eventId} took over ${APPLY_EVENT_DEADLINE_MS}ms`),
  );

  if (!result) {
    // E.g. a `stripe trigger` event, or one for another environment's database.
    logError(new Error(`No order ${event.orderId} for ${event.kind} event ${event.eventId}`), "applyPaymentEvent", {
      level: "warn",
    });
    return { outcome: "unknown_order", orderNumber: null, confirmation: null };
  }

  const { order, plan } = result;
  if (plan.problem) logError(new Error(plan.problem), `applyPaymentEvent ${event.eventId}`);
  console.info(`[payments] ${event.kind} ${event.eventId} for ${order.orderNumber}: ${plan.outcome}`);

  if (!plan.sendConfirmation) return { outcome: plan.outcome, orderNumber: order.orderNumber, confirmation: null };
  try {
    const branch = await firestoreRead(branchesRef().doc(order.branchId).get(), `branches/${order.branchId}`);
    return { outcome: plan.outcome, orderNumber: order.orderNumber, confirmation: toOrderConfirmation(order, toBranch(branch)) };
  } catch (error) {
    // The order is paid and saved; only the email is lost. A retry would be a duplicate, so don't fail.
    logError(error, `applyPaymentEvent ${order.orderNumber}: no confirmation email`);
    return { outcome: plan.outcome, orderNumber: order.orderNumber, confirmation: null };
  }
}
