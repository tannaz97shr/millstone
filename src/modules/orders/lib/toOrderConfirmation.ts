import type { Branch, Order } from "@/shared/domain";
import type { OrderConfirmation } from "../types/orderConfirmation";

/** "Ben" from "Ben Okafor". */
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

/** The view C7 and the confirmation email share. */
export function toOrderConfirmation(order: Order, branch: Branch): OrderConfirmation {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
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
      lineTotalCents: item.lineTotalCents,
    })),
    totalCents: order.totalCents,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    contactFirstName: firstNameOf(order.contactName),
    contactEmail: order.contactEmail,
  };
}
