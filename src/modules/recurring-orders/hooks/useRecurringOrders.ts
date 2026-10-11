"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRecurringOrder, fetchRecurringOrders } from "../api/recurringApi";
import { recurringKeys } from "../api/queryKeys";

/** C10 and C9's section. Cutoffs pass and orders get made, so it's fetched fresh on each visit. */
export function useRecurringOrders() {
  return useQuery({ queryKey: recurringKeys.list(), queryFn: fetchRecurringOrders, staleTime: 0 });
}

/** C12 and C11 edit. A 404 (not this account's, or gone) isn't retried. */
export function useRecurringOrder(recurringOrderId: string) {
  return useQuery({
    queryKey: recurringKeys.detail(recurringOrderId),
    queryFn: () => fetchRecurringOrder(recurringOrderId),
    staleTime: 0,
  });
}
