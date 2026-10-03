import type { OrderId } from "@/shared/domain";

/** POST /api/orders: 201 for a new order, 200 when the checkout key already placed one. */
export interface PlaceOrderResponse {
  orderId: OrderId;
  orderNumber: string;
}
