import { apiRoutes } from "@/shared/api-routes";
import { apiClient } from "@/shared/lib/http/apiClient";
import type { OrderConfirmationView } from "../types/orderConfirmation";

export async function fetchOrderConfirmation(orderId: string): Promise<OrderConfirmationView> {
  const response = await apiClient.get<OrderConfirmationView>(apiRoutes.orderConfirmation(orderId));
  return response.data;
}
