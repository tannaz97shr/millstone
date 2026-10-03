// Single source of truth for API paths. Endpoints are added with the features
// that need them; never hand-build an /api path elsewhere.

export const apiRoutes = {
  branches: "/api/branches",
  branchMenu: (branchId: string, date: string) =>
    `/api/branches/${encodeURIComponent(branchId)}/menu?${new URLSearchParams({ date })}`,
  /** POST: place an order (C5). */
  orders: "/api/orders",
  /** GET: what C7 shows for one order. */
  orderConfirmation: (orderId: string) => `/api/orders/${encodeURIComponent(orderId)}`,
} as const;

export type ApiRoutes = typeof apiRoutes;
