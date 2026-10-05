import { apiRoutes } from "@/shared/api-routes";
import { apiClient } from "@/shared/lib/http/apiClient";
import type { AvailabilityActionRequest } from "../lib/availabilityActionSchema";
import type { AvailabilityActionResult, BranchAvailability } from "../types/availability";

/** A transaction gets 8s on the server (AVAILABILITY_ACTION_DEADLINE_MS), then the orders check; the rest is network. */
const ACTION_TIMEOUT_MS = 20_000;

export async function fetchBranchAvailability(branchId: string): Promise<BranchAvailability> {
  const response = await apiClient.get<BranchAvailability>(apiRoutes.admin.branchAvailability(branchId));
  return response.data;
}

export async function postAvailabilityAction(
  branchId: string,
  action: AvailabilityActionRequest,
): Promise<AvailabilityActionResult> {
  const response = await apiClient.post<AvailabilityActionResult>(
    apiRoutes.admin.branchAvailabilityAction(branchId),
    action,
    { timeout: ACTION_TIMEOUT_MS },
  );
  return response.data;
}
