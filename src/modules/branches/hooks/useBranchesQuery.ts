"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBranches } from "../api/branchesApi";
import { branchKeys } from "../api/queryKeys";

/** Every branch with its pickup calendar, in display order. */
export function useBranchesQuery() {
  return useQuery({ queryKey: branchKeys.list(), queryFn: fetchBranches });
}
