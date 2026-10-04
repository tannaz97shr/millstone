import { queryOptions } from "@tanstack/react-query";
import type { AdminOrderFilters } from "../lib/orderFilters";
import { fetchAdminOrder, fetchAdminOrders } from "./adminOrdersApi";
import { adminOrderKeys } from "./queryKeys";

/** AC-A4: new orders appear without a reload, every 30 seconds. */
export const ADMIN_REFRESH_MS = 30_000;

/** Fresh enough not to refetch straight after the server's prefetch; actions invalidate anyway. */
const STALE_MS = 10_000;

export const adminOrdersQueryOptions = (filters: AdminOrderFilters) =>
  queryOptions({
    queryKey: adminOrderKeys.list(filters),
    queryFn: () => fetchAdminOrders(filters),
    staleTime: STALE_MS,
  });

export const adminOrderQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: adminOrderKeys.detail(orderId),
    queryFn: () => fetchAdminOrder(orderId),
    staleTime: STALE_MS,
  });
