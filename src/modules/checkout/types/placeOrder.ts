import type { OrderId } from "@/shared/domain";

/**
 * POST /api/orders: 201 for a new order, 200 when the checkout key already
 * made one. `next` says where the customer goes: C7 (C6 while an online
 * payment is confirming), or the payment provider's page.
 */
export type PlaceOrderResponse =
  | { orderId: OrderId; orderNumber: string; next: "confirmation" }
  | { orderId: OrderId; orderNumber: string; next: "pay"; paymentUrl: string };
