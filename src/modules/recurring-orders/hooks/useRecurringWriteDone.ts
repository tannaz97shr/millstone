"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { accountKeys } from "@/modules/account/api/queryKeys";
import { recurringKeys } from "../api/queryKeys";
import type { RecurringOrderDetail } from "../types/recurringOrderView";

/**
 * After any save: the answer is the fresh detail, the list changes with it,
 * and C9's order history too (a save first makes any order that's due).
 */
export function useRecurringWriteDone() {
  const queryClient = useQueryClient();
  return useCallback(
    (detail: RecurringOrderDetail) => {
      queryClient.setQueryData(recurringKeys.detail(detail.id), detail);
      void queryClient.invalidateQueries({ queryKey: recurringKeys.list() });
      void queryClient.invalidateQueries({ queryKey: accountKeys.orders() });
    },
    [queryClient],
  );
}
