import type { Branch, Order, VisibleOrderStatus } from "@/shared/domain";
import type { AdminOrderDetail, AdminOrderRow } from "../types/adminOrder";
import { adminPaymentLabel } from "./paymentLabel";

/** Only call with a visible order (see isVisibleStatus). */
export function toAdminOrderRow(order: Order & { status: VisibleOrderStatus }, branch: Pick<Branch, "name">): AdminOrderRow {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    branchId: order.branchId,
    branchName: branch.name,
    pickupDate: order.pickupDate,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentLabel: adminPaymentLabel(order),
    contactName: order.contactName,
    contactPhone: order.contactPhone,
    items: order.items.map((item) => ({ name: item.productName, quantity: item.quantity })),
    totalCents: order.totalCents,
    recurring: order.recurringOrderId !== null,
    notes: order.notes.trim() ? order.notes : null,
    generationNote: order.generationNote,
    createdAt: order.createdAt,
  };
}

/**
 * `dashboardUrl` turns a payment reference into the provider's dashboard
 * link (paymentDashboardUrl, server-only), so this mapper stays pure.
 */
export function toAdminOrderDetail(
  order: Order & { status: VisibleOrderStatus },
  branch: Pick<Branch, "name">,
  dashboardUrl: (paymentRef: string | null) => string | null,
): AdminOrderDetail {
  return {
    ...toAdminOrderRow(order, branch),
    contactEmail: order.contactEmail,
    lines: order.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
    })),
    paymentRef: order.paymentRef,
    paymentDashboardUrl: order.paymentMethod === "online" ? dashboardUrl(order.paymentRef) : null,
    cancellationReason: order.cancellationReason,
    cancellationNote: order.cancellationNote,
    paidAt: order.paidAt,
    readyAt: order.readyAt,
    collectedAt: order.collectedAt,
    cancelledAt: order.cancelledAt,
    refundedAt: order.refundedAt,
  };
}
