"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { fetchOrderConfirmation } from "../api/ordersApi";
import { orderKeys } from "../api/queryKeys";
import {
  checkAgainStart,
  confirmingInterval,
  confirmingPhase,
  msUntilNextPhase,
} from "../lib/confirmingPhase";

/**
 * C6 and C7's order. While it's waiting for the payment webhook, it's asked
 * for again on confirmingPhase's schedule and whenever the tab comes back into
 * view. Once placed or expired, what it shows doesn't change, so it's never
 * refetched.
 */
export function useOrderConfirmationQuery(orderId: string) {
  // When C6 started waiting, and the clock as of the last phase change.
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const phase = confirmingPhase(now - startedAt);

  const query = useQuery({
    queryKey: orderKeys.confirmation(orderId),
    queryFn: () => fetchOrderConfirmation(orderId),
    staleTime: ({ state }) => (state.data?.state === "awaiting_payment" ? 0 : Infinity),
    refetchInterval: ({ state }) => (state.data?.state === "awaiting_payment" ? confirmingInterval(phase) : false),
  });
  const awaiting = query.data?.state === "awaiting_payment";

  // Re-render at each phase boundary (Confirming → ConfirmingSlow → stopped).
  useEffect(() => {
    if (!awaiting) return;
    const wait = msUntilNextPhase(now - startedAt);
    if (wait === null) return;
    const timer = setTimeout(() => setNow(Date.now()), wait);
    return () => clearTimeout(timer);
  }, [awaiting, now, startedAt]);

  const { refetch } = query;
  /** ConfirmingSlow's Check again: ask now, and poll for another 5 minutes. */
  const checkAgain = useCallback(() => {
    const at = Date.now();
    setStartedAt(checkAgainStart(at));
    setNow(at);
    void refetch();
  }, [refetch]);

  return { query, phase, checkAgain };
}
