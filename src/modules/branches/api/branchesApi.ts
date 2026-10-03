import { apiRoutes } from "@/shared/api-routes";
import { apiClient } from "@/shared/lib/http/apiClient";
import type { BranchesResponse } from "../types/branchSummary";

export async function fetchBranches(): Promise<BranchesResponse> {
  const response = await apiClient.get<BranchesResponse>(apiRoutes.branches);
  return response.data;
}
