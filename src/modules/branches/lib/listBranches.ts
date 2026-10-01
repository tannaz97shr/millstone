import "server-only";
import type { Branch, BranchId } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { branchesRef } from "@/shared/lib/firebase/collections";
import { pickupCalendar } from "@/shared/utils/pickup-dates";
import type { BranchesResponse, BranchSummary } from "../types/branchSummary";
import { toBranch } from "./toBranch";

export async function listBranches(): Promise<Branch[]> {
  const snapshot = await branchesRef().get();
  return snapshot.docs.map(toBranch).sort((a, b) => a.displayOrder - b.displayOrder);
}

/** The branch, or a 404 ApiError for an ID that doesn't exist. */
export async function getBranchOrThrow(branchId: BranchId): Promise<Branch> {
  const snapshot = await branchesRef().doc(branchId).get();
  if (!snapshot.exists) {
    throw new ApiError(404, "unknown_branch", `No branch "${branchId}"`);
  }
  return toBranch(snapshot);
}

export function toBranchSummary(branch: Branch, now: Date): BranchSummary {
  return {
    id: branch.id,
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    orderCutoffTime: branch.orderCutoffTime,
    opensAt: branch.opensAt,
    closedDays: [...branch.closedDays],
    pickup: pickupCalendar(branch, now),
  };
}

/** GET /api/branches, and the server prefetch for the same query. */
export async function getBranchesResponse(now: Date): Promise<BranchesResponse> {
  const branches = await listBranches();
  return { branches: branches.map((branch) => toBranchSummary(branch, now)) };
}
