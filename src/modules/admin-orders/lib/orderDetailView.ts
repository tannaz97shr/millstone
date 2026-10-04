import type { IsoInstant } from "@/shared/domain";
import type { AdminOrderDetail } from "../types/adminOrder";

// What A3 says about an order's past and its money (AC-A5). Pure: the panel
// formats the times and picks the words.

export type HistoryEvent = "placed" | "paid" | "ready" | "collected" | "cancelled" | "refunded";

export interface HistoryEntry {
  event: HistoryEvent;
  at: IsoInstant;
}

/** One line per status timestamp that's set, oldest first. */
export function orderHistory(order: AdminOrderDetail): HistoryEntry[] {
  const entries: [HistoryEvent, IsoInstant | null][] = [
    ["placed", order.createdAt],
    ["paid", order.paidAt],
    ["ready", order.readyAt],
    ["collected", order.collectedAt],
    ["cancelled", order.cancelledAt],
    ["refunded", order.refundedAt],
  ];
  return entries
    .flatMap(([event, at]) => (at ? [{ event, at }] : []))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

export type PaymentLine =
  | { kind: "refunded"; at: IsoInstant | null; ref: string | null }
  | { kind: "paid"; at: IsoInstant | null; ref: string | null }
  | { kind: "nothing_paid" }
  | { kind: "unpaid" };

/** The line under "Paid online" / "Pay at pickup" (design-system README, order states). */
export function paymentLine(order: AdminOrderDetail): PaymentLine {
  if (order.paymentStatus === "refunded") return { kind: "refunded", at: order.refundedAt, ref: order.paymentRef };
  if (order.paymentStatus === "paid") return { kind: "paid", at: order.paidAt, ref: order.paymentRef };
  return order.status === "cancelled" ? { kind: "nothing_paid" } : { kind: "unpaid" };
}

/** Cancelled after being paid online: the refund reminder and Mark refunded (AC-A9). */
export const isRefundDue = (order: Pick<AdminOrderDetail, "status" | "paymentMethod" | "paymentStatus">) =>
  order.status === "cancelled" && order.paymentMethod === "online" && order.paymentStatus === "paid";

export const isFinal = (order: Pick<AdminOrderDetail, "status">) =>
  order.status === "collected" || order.status === "cancelled";
