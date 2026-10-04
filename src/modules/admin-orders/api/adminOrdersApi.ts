import { apiRoutes } from "@/shared/api-routes";
import { apiClient } from "@/shared/lib/http/apiClient";
import { type AdminOrderFilters, filtersToQuery } from "../lib/orderFilters";
import type { OrderActionRequest } from "../lib/orderActionSchema";
import type { AdminOrderActionResult, AdminOrderDetail, AdminOrderList } from "../types/adminOrder";

/** A transaction gets 8s on the server (ORDER_ACTION_DEADLINE_MS); the rest is network. */
const ACTION_TIMEOUT_MS = 15_000;

export async function fetchAdminOrders(filters: AdminOrderFilters): Promise<AdminOrderList> {
  const response = await apiClient.get<AdminOrderList>(apiRoutes.admin.orders(filtersToQuery(filters)));
  return response.data;
}

export async function fetchAdminOrder(orderId: string): Promise<AdminOrderDetail> {
  const response = await apiClient.get<AdminOrderDetail>(apiRoutes.admin.order(orderId));
  return response.data;
}

export async function postOrderAction(orderId: string, action: OrderActionRequest): Promise<AdminOrderActionResult> {
  const response = await apiClient.post<AdminOrderActionResult>(apiRoutes.admin.orderAction(orderId), action, {
    timeout: ACTION_TIMEOUT_MS,
  });
  return response.data;
}
