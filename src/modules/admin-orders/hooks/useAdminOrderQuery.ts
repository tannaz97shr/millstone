"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_REFRESH_MS, adminOrderQueryOptions } from "../api/adminOrderQueries";

/** The order open in A3, refreshed with the list. Null waits. */
export function useAdminOrderQuery(orderId: string | null) {
  return useQuery({
    ...adminOrderQueryOptions(orderId ?? ""),
    enabled: orderId !== null,
    refetchInterval: ADMIN_REFRESH_MS,
    refetchIntervalInBackground: true,
  });
}
