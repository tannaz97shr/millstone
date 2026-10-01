import type { BranchId, IsoDate } from "@/shared/domain";

export const menuKeys = {
  all: ["menu"] as const,
  detail: (branchId: BranchId, date: IsoDate) => [...menuKeys.all, branchId, date] as const,
};
