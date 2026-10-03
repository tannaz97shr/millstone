import type { Branch } from "@/shared/domain";
import type { PickupCalendar } from "@/shared/utils/pickup-dates";

/** What customers see of a branch, with its pickup dates worked out on the server. */
export interface BranchSummary
  extends Pick<
    Branch,
    "id" | "name" | "address" | "phone" | "orderCutoffTime" | "opensAt" | "closedDays"
  > {
  pickup: PickupCalendar;
}

/** GET /api/branches */
export interface BranchesResponse {
  branches: BranchSummary[];
}
