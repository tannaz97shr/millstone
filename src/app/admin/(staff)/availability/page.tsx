import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getStaffPageSession } from "@/modules/auth/lib/staffPageSession";
import { AvailabilityScreen } from "@/modules/availability/components/AvailabilityScreen";
import { availabilityViewFromUrl, availabilityViewToQuery } from "@/modules/availability/lib/availabilityView";
import { prefetchBranchAvailability } from "@/modules/availability/lib/prefetchBranchAvailability";
import { listBranches } from "@/modules/branches/lib/listBranches";
import type { BranchId } from "@/shared/domain";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";
import { routes } from "@/shared/routes";

export interface AdminAvailabilityPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The branches this person may open: staff their own; the owner every branch, in C1's order. */
async function branchIdsFor(owner: boolean, staffBranchId: BranchId | null): Promise<BranchId[]> {
  if (!owner) {
    if (!staffBranchId) throw new Error("A staff account has no branch");
    return [staffBranchId];
  }
  return (await listBranches()).map((branch) => branch.id);
}

// A4. Rendered per request: the earliest pickup date depends on the clock,
// and the branch on who is signed in. The API checks for itself.
export default async function AdminAvailabilityPage({ searchParams }: AdminAvailabilityPageProps) {
  await connection();
  const actor = await getStaffPageSession();
  const owner = actor.role === "owner";
  const view = availabilityViewFromUrl(await searchParams);

  const branchIds = await branchIdsFor(owner, actor.branchId);
  const defaultBranchId = branchIds[0];
  if (owner && view.branch && !branchIds.includes(view.branch)) {
    redirect(routes.admin.availability(availabilityViewToQuery({ ...view, branch: null })));
  }
  const branchId = owner ? (view.branch ?? defaultBranchId) : defaultBranchId;

  const queryClient = getQueryClient();
  await prefetchBranchAvailability(queryClient, actor, branchId, new Date());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AvailabilityScreen owner={owner} defaultBranchId={defaultBranchId} />
    </HydrationBoundary>
  );
}
