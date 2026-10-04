import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import type { StaffActor } from "@/modules/auth/lib/requireSession";
import type { BranchId } from "@/shared/domain";
import { availabilityKeys } from "../api/queryKeys";
import { getBranchAvailability } from "./getBranchAvailability";

/** Server-side fill of the query A4 makes through GET /api/admin/branches/{id}/availability. */
export async function prefetchBranchAvailability(
  queryClient: QueryClient,
  actor: StaffActor,
  branchId: BranchId,
  now: Date,
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: availabilityKeys.detail(branchId),
    queryFn: () => getBranchAvailability(actor, branchId, now),
  });
}
