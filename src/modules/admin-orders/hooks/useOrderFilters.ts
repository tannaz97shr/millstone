"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { OrderId } from "@/shared/domain";
import { routes } from "@/shared/routes";
import { adminOrderIdParam } from "../lib/adminOrderParams";
import { type AdminOrderFilters, filtersFromUrl, filtersToQuery } from "../lib/orderFilters";

/**
 * A2's filters and the order open in A3 live in the URL, so a reload, or a
 * trip through A1 when the session ends, comes back to the same view. Writes
 * use history.replaceState: no new history entry, no server round trip.
 * Staff never get a branch filter: theirs is the only branch.
 */
export function useOrderFilters(owner: boolean) {
  const params = useSearchParams();

  const filters = useMemo<AdminOrderFilters>(() => {
    const read = filtersFromUrl(params);
    return owner ? read : { ...read, branch: null };
  }, [params, owner]);

  const openOrderId = useMemo<OrderId | null>(() => {
    const parsed = adminOrderIdParam.safeParse(params.get("order") ?? undefined);
    return parsed.success ? parsed.data : null;
  }, [params]);

  const write = useCallback((next: AdminOrderFilters, order: OrderId | null) => {
    window.history.replaceState(null, "", routes.admin.orders(filtersToQuery(next), order));
  }, []);

  const setFilters = useCallback(
    (changes: Partial<AdminOrderFilters>) => write({ ...filters, ...changes }, openOrderId),
    [filters, openOrderId, write],
  );

  const setOpenOrder = useCallback((orderId: OrderId | null) => write(filters, orderId), [filters, write]);

  return { filters, setFilters, openOrderId, setOpenOrder };
}
