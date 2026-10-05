import { queryOptions } from "@tanstack/react-query";
import { fetchBranchAvailability } from "./availabilityApi";
import { availabilityKeys } from "./queryKeys";

/** A changed row on another tablet shows within a minute; a tap on a stale row gets a 409 anyway. */
export const AVAILABILITY_REFRESH_MS = 60_000;

export const branchAvailabilityQueryOptions = (branchId: string) =>
  queryOptions({
    queryKey: availabilityKeys.detail(branchId),
    queryFn: () => fetchBranchAvailability(branchId),
  });
