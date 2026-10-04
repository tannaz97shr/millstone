import type { AdminOrderFilters } from "../lib/orderFilters";
import { filtersToQuery } from "../lib/orderFilters";

export const adminOrderKeys = {
  all: ["admin-orders"] as const,
  lists: () => [...adminOrderKeys.all, "list"] as const,
  /** Keyed by the query values, so equal filters share a cache entry. */
  list: (filters: AdminOrderFilters) => [...adminOrderKeys.lists(), filtersToQuery(filters)] as const,
  details: () => [...adminOrderKeys.all, "detail"] as const,
  detail: (orderId: string) => [...adminOrderKeys.details(), orderId] as const,
};
