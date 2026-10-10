"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAccountSession } from "../api/accountApi";
import { accountKeys } from "../api/queryKeys";

/**
 * The signed-in customer, or null for a guest (or a staff session). Filled
 * by the customer layout's server prefetch, so the first render already
 * knows. Signing in or out reloads the page, which fetches it again.
 */
export function useAccountSession() {
  return useQuery({
    queryKey: accountKeys.session(),
    queryFn: fetchAccountSession,
    staleTime: 5 * 60_000,
  });
}
