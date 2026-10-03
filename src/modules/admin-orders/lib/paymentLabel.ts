import type { Order, PaymentStatus, VisibleOrderStatus } from "@/shared/domain";
import { VISIBLE_ORDER_STATUSES } from "@/shared/domain";

/**
 * The payment label staff see (AC-A2, design-system README). A cancelled
 * pay-at-pickup order took no money, so it has none. A cancelled online order
 * keeps Paid (refund still owed) or Refunded.
 */
export function adminPaymentLabel(
  order: Pick<Order, "status" | "paymentMethod" | "paymentStatus">,
): PaymentStatus | null {
  if (order.status === "cancelled" && order.paymentMethod === "at_pickup") return null;
  return order.paymentStatus;
}

/** awaiting_payment and expired never reach staff. */
export function isVisibleStatus(status: Order["status"]): status is VisibleOrderStatus {
  return (VISIBLE_ORDER_STATUSES as readonly string[]).includes(status);
}
