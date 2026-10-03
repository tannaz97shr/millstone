import { apiRoutes } from "@/shared/api-routes";
import { apiClient } from "@/shared/lib/http/apiClient";
import type { PlaceOrderRequest } from "../lib/checkoutSchema";
import type { PlaceOrderResponse } from "../types/placeOrder";

/** The server allows the order transaction 8s; the rest is network headroom. */
const PLACE_ORDER_TIMEOUT_MS = 15_000;

export async function postOrder(request: PlaceOrderRequest): Promise<PlaceOrderResponse> {
  const response = await apiClient.post<PlaceOrderResponse>(apiRoutes.orders, request, {
    timeout: PLACE_ORDER_TIMEOUT_MS,
  });
  return response.data;
}
