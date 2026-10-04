export const availabilityKeys = {
  all: ["admin-availability"] as const,
  detail: (branchId: string) => [...availabilityKeys.all, branchId] as const,
};
