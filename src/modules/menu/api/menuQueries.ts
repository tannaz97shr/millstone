import { queryOptions } from "@tanstack/react-query";
import type { BranchId, IsoDate } from "@/shared/domain";
import { fetchBranchMenu } from "./menuApi";
import { menuKeys } from "./queryKeys";

/** One branch's menu for one pickup date: the same query for useQuery and fetchQuery. */
export const menuQueryOptions = (branchId: BranchId, date: IsoDate) =>
  queryOptions({
    queryKey: menuKeys.detail(branchId, date),
    queryFn: () => fetchBranchMenu(branchId, date),
  });
