import type { Branch, Order, OrderStatus, VisibleOrderStatus } from "@/shared/domain";
import type { AccountOrder } from "../types/accountOrder";

/** Orders a customer ever sees: not one waiting for payment, nor one that expired unpaid. */
export function isVisibleToCustomer(status: OrderStatus): status is VisibleOrderStatus {
  return status !== "awaiting_payment" && status !== "expired";
}

/** An order as its account sees it. The caller checks it's visible and the account's own. */
export function toAccountOrder(order: Order & { status: VisibleOrderStatus }, branch: Branch): AccountOrder {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    pickupDate: order.pickupDate,
    branch: {
      id: branch.id,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      opensAt: branch.opensAt,
    },
    lines: order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
    })),
    totalCents: order.totalCents,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    recurring: order.recurringOrderId !== null,
    generationNote: order.generationNote,
    notes: order.notes,
    contact: { name: order.contactName, phone: order.contactPhone, email: order.contactEmail },
    createdAt: order.createdAt,
  };
}
