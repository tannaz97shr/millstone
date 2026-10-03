import { apiRoutes } from "@/shared/api-routes";
import { apiClient } from "@/shared/lib/http/apiClient";
import type { OrderConfirmation } from "../types/orderConfirmation";

export async function fetchOrderConfirmation(orderId: string): Promise<OrderConfirmation> {
  const response = await apiClient.get<OrderConfirmation>(apiRoutes.orderConfirmation(orderId));
  return response.data;
}
