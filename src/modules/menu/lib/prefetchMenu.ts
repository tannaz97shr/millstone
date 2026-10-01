import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import type { BranchId, IsoDate } from "@/shared/domain";
import { menuKeys } from "../api/queryKeys";
import { getBranchMenu } from "./getBranchMenu";

/** Server-side fill of the same query the browser makes through GET /api/branches/{id}/menu. */
export async function prefetchMenu(
  queryClient: QueryClient,
  branchId: BranchId,
  date: IsoDate,
  now: Date,
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: menuKeys.detail(branchId, date),
    queryFn: () => getBranchMenu(branchId, date, now),
  });
}
