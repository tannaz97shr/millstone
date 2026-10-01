import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { branchKeys } from "../api/queryKeys";
import type { BranchesResponse } from "../types/branchSummary";
import { getBranchesResponse } from "./listBranches";

/**
 * Server-side fill of the same query the browser makes through
 * GET /api/branches, so the page arrives with the branches already in it.
 * Returns the data, or undefined when the read failed (the browser retries
 * and shows the error state).
 */
export async function prefetchBranches(
  queryClient: QueryClient,
  now: Date,
): Promise<BranchesResponse | undefined> {
  await queryClient.prefetchQuery({
    queryKey: branchKeys.list(),
    queryFn: () => getBranchesResponse(now),
  });
  return queryClient.getQueryData<BranchesResponse>(branchKeys.list());
}
