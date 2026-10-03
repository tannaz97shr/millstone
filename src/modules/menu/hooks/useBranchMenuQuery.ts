"use client";

import { useQuery } from "@tanstack/react-query";
import type { BranchId, IsoDate } from "@/shared/domain";
import { menuQueryOptions } from "../api/menuQueries";

/**
 * One branch's menu for a pickup date. While another date loads, the previous
 * date's menu for the same branch stays as placeholder data (isPlaceholderData).
 * A null branch or date waits.
 */
export function useBranchMenuQuery(branchId: BranchId | null, date: IsoDate | null) {
  return useQuery({
    ...menuQueryOptions(branchId ?? ("" as BranchId), date ?? ("" as IsoDate)),
    enabled: branchId !== null && date !== null,
    placeholderData: (previous) => (previous?.branchId === branchId ? previous : undefined),
  });
}
