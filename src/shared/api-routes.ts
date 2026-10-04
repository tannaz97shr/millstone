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
  admin: {
    /** POST: staff sign-in (A1). */
    signIn: "/api/admin/sign-in",
    /** POST: ends the session. */
    signOut: "/api/admin/sign-out",
    /** GET: the A2 list. `query` comes from filtersToQuery (defaults left out). */
    orders: (query: Record<string, string> = {}) => {
      const search = new URLSearchParams(query).toString();
      return search ? `/api/admin/orders?${search}` : "/api/admin/orders";
    },
    /** GET: one order for the A3 panel, scoped to the staff member's branch. */
    order: (orderId: string) => `/api/admin/orders/${encodeURIComponent(orderId)}`,
    /** POST: ready, collect, undo, cancel or mark refunded. */
    orderAction: (orderId: string) => `/api/admin/orders/${encodeURIComponent(orderId)}/actions`,
    /** GET: A4, every active product with its row at one branch. */
    branchAvailability: (branchId: string) =>
      `/api/admin/branches/${encodeURIComponent(branchId)}/availability`,
    /** POST: switch on or off, mark sold out for a date, or back on sale. */
    branchAvailabilityAction: (branchId: string) =>
      `/api/admin/branches/${encodeURIComponent(branchId)}/availability/actions`,
    /** GET: the product catalogue (owner only). */
    products: "/api/admin/products",
  },
} as const;

export type ApiRoutes = typeof apiRoutes;
