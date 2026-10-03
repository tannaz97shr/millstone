"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOrderConfirmation } from "../api/ordersApi";
import { orderKeys } from "../api/queryKeys";

/** C7's order. What it shows doesn't change once placed, so it's never refetched. */
export function useOrderConfirmationQuery(orderId: string) {
  return useQuery({
    queryKey: orderKeys.confirmation(orderId),
    queryFn: () => fetchOrderConfirmation(orderId),
    staleTime: Infinity,
  });
}
