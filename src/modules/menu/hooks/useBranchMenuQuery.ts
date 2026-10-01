"use client";

import { useQuery } from "@tanstack/react-query";
import type { BranchId, IsoDate } from "@/shared/domain";
import { fetchBranchMenu } from "../api/menuApi";
import { menuKeys } from "../api/queryKeys";

/**
 * One branch's menu for a pickup date. While another date loads, the previous
 * date's menu for the same branch stays as placeholder data (isPlaceholderData).
 */
export function useBranchMenuQuery(branchId: BranchId, date: IsoDate | null) {
  return useQuery({
    queryKey: menuKeys.detail(branchId, date ?? ("" as IsoDate)),
    queryFn: () => fetchBranchMenu(branchId, date as IsoDate),
    enabled: date !== null,
    placeholderData: (previous) => (previous?.branchId === branchId ? previous : undefined),
  });
}
