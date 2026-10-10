"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAccountOrder, fetchAccountOrders } from "../api/accountApi";
import { accountKeys } from "../api/queryKeys";

/** C9 "Your orders". Statuses change at the counter, so it's fetched fresh on each visit. */
export function useAccountOrders() {
  return useQuery({ queryKey: accountKeys.orders(), queryFn: fetchAccountOrders, staleTime: 0 });
}

/** One of the account's orders. A 404 (not this account's, or gone) isn't retried. */
export function useAccountOrder(orderId: string) {
  return useQuery({ queryKey: accountKeys.order(orderId), queryFn: () => fetchAccountOrder(orderId), staleTime: 0 });
}
