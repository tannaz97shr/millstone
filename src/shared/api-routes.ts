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
  account: {
    /** POST: customer sign-in (C8). */
    signIn: "/api/account/sign-in",
    /** POST: create an account (C8), or set a password on a guest's record (AC-U1). */
    signUp: "/api/account/sign-up",
    /** POST: ends the session. */
    signOut: "/api/account/sign-out",
    /** GET: the signed-in customer, or null (staff and guests). */
    session: "/api/account/session",
    /** PATCH: the account's name, mobile and email (C9). */
    profile: "/api/account/profile",
    /** GET: the account's order history (C9). */
    orders: "/api/account/orders",
    /** GET: one of the account's own orders. */
    order: (orderId: string) => `/api/account/orders/${encodeURIComponent(orderId)}`,
    /** POST: C7's "Save your details": an account from a guest order (AC-C10). */
    fromOrder: "/api/account/from-order",
    /** GET: the account's recurring orders (C10, C9); POST: a new one (C11). */
    recurringOrders: "/api/account/recurring-orders",
    /** GET: one recurring order with its upcoming pickups (C12); PATCH: save changes (C11 edit). */
    recurringOrder: (recurringOrderId: string) =>
      `/api/account/recurring-orders/${encodeURIComponent(recurringOrderId)}`,
    /** POST: pause, resume, skip, unskip or end (C12). */
    recurringOrderAction: (recurringOrderId: string) =>
      `/api/account/recurring-orders/${encodeURIComponent(recurringOrderId)}/actions`,
  },
  webhooks: {
    /** POST, from Stripe only: signed payment events (checkout paid or expired). */
    stripe: "/api/webhooks/stripe",
  },
  cron: {
    /** GET, from Vercel Cron only (Bearer CRON_SECRET): daily recurring-order generation. Also named in vercel.json. */
    recurringOrders: "/api/cron/recurring-orders",
  },
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
    /** GET: the product catalogue; POST: a new product (owner only). */
    products: "/api/admin/products",
    /** PATCH: save a product's fields, hide or show it. */
    product: (productId: string) => `/api/admin/products/${encodeURIComponent(productId)}`,
    /** POST (multipart): a new photo for the product. */
    productPhoto: (productId: string) => `/api/admin/products/${encodeURIComponent(productId)}/photo`,
  },
} as const;

export type ApiRoutes = typeof apiRoutes;
