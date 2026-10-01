import type { BranchId, IsoDate } from "@/shared/domain";
import { apiRoutes } from "@/shared/api-routes";
import { apiClient } from "@/shared/lib/http/apiClient";
import type { BranchMenu } from "../types/menu";

export async function fetchBranchMenu(branchId: BranchId, date: IsoDate): Promise<BranchMenu> {
  const response = await apiClient.get<BranchMenu>(apiRoutes.branchMenu(branchId, date));
  return response.data;
}
