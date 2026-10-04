// Single source of truth for page paths. Never hand-build a path elsewhere;
// add a helper here for anything with params.

export const routes = {
  home: "/",
  /** C2: a branch's menu, optionally for a pickup date ("YYYY-MM-DD"). */
  menu: (branchId: string, date?: string | null) => {
    const path = `/menu/${encodeURIComponent(branchId)}`;
    return date ? `${path}?${new URLSearchParams({ date })}` : path;
  },
  cart: "/cart",
  checkout: "/checkout",
  /** C7: one order's confirmation, by its unguessable ID. */
  orderConfirmation: (orderId: string) => `/orders/${encodeURIComponent(orderId)}`,
  admin: {
    home: "/admin",
    /**
     * A2 with its filters and the order open in A3. `query` comes from
     * filtersToQuery; `order` is the open order's ID.
     */
    orders: (query: Record<string, string> = {}, order?: string | null) => {
      const params = new URLSearchParams(query);
      if (order) params.set("order", order);
      const search = params.toString();
      return search ? `/admin?${search}` : "/admin";
    },
    /** A1. `returnTo` is where to go after signing in (checked by safeAdminReturnPath). */
    signIn: (returnTo?: string | null) =>
      returnTo ? `/admin/sign-in?${new URLSearchParams({ returnTo })}` : "/admin/sign-in",
    /**
     * A4. `query` comes from availabilityViewToQuery: the owner's branch and
     * the "Mark sold out for" date, both left out when they're the default.
     */
    availability: (query: Record<string, string> = {}) => {
      const search = new URLSearchParams(query).toString();
      return search ? `/admin/availability?${search}` : "/admin/availability";
    },
    /** A5, owner only (placeholder until the products step). */
    products: "/admin/products",
  },
  dev: {
    tokens: "/dev/tokens",
    components: "/dev/components",
    /** Confirmation emails written in development, newest first. */
    emails: "/dev/emails",
    /** One email, shown at a phone (390) or desktop-client (600) width. */
    email: (emailId: string, width?: number) => {
      const path = `/dev/emails/${encodeURIComponent(emailId)}`;
      return width ? `${path}?${new URLSearchParams({ width: String(width) })}` : path;
    },
  },
} as const;
