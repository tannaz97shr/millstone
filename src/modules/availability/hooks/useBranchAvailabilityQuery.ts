"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AVAILABILITY_REFRESH_MS, branchAvailabilityQueryOptions } from "../api/availabilityQueries";

/** A4 for one branch. While the owner's next branch loads, the previous one stays up (isPlaceholderData). */
export function useBranchAvailabilityQuery(branchId: string) {
  return useQuery({
    ...branchAvailabilityQueryOptions(branchId),
    refetchInterval: AVAILABILITY_REFRESH_MS,
    placeholderData: keepPreviousData,
  });
}
