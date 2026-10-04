"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ADMIN_REFRESH_MS, adminOrdersQueryOptions } from "../api/adminOrderQueries";
import type { AdminOrderFilters } from "../lib/orderFilters";

/**
 * The A2 list, refreshed every 30 seconds even while the tablet's tab isn't
 * focused (AC-A4). While other filters load, the previous list stays up.
 */
export function useAdminOrdersQuery(filters: AdminOrderFilters) {
  return useQuery({
    ...adminOrdersQueryOptions(filters),
    refetchInterval: ADMIN_REFRESH_MS,
    refetchIntervalInBackground: true,
    placeholderData: keepPreviousData,
  });
}
