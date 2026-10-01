// Single source of truth for API paths. Endpoints are added with the features
// that need them; never hand-build an /api path elsewhere.

export const apiRoutes = {
  branches: "/api/branches",
  branchMenu: (branchId: string, date: string) =>
    `/api/branches/${encodeURIComponent(branchId)}/menu?${new URLSearchParams({ date })}`,
} as const;

export type ApiRoutes = typeof apiRoutes;
