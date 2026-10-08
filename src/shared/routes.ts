// Single source of truth for page paths. Never hand-build a path elsewhere;
// add a helper here for anything with params.

/** The query param the payment page's back link adds to C5 (routes.checkoutPaymentCancelled). */
export const paymentCancelledParam = { name: "payment", value: "cancelled" } as const;

export const routes = {
  home: "/",
  /** C2: a branch's menu, optionally for a pickup date ("YYYY-MM-DD"). */
  menu: (branchId: string, date?: string | null) => {
    const path = `/menu/${encodeURIComponent(branchId)}`;
    return date ? `${path}?${new URLSearchParams({ date })}` : path;
  },
  cart: "/cart",
  checkout: "/checkout",
  /** C5 after the customer backed out of (or failed) the payment page: CheckoutPayFailed's message. */
  checkoutPaymentCancelled: `/checkout?${new URLSearchParams({ [paymentCancelledParam.name]: paymentCancelledParam.value })}`,
  /** C7: one order's confirmation, by its unguessable ID. */
  orderConfirmation: (orderId: string) => `/orders/${encodeURIComponent(orderId)}`,
  account: {
    /** C9 My account (signed-in customers). */
    home: "/account",
    /**
     * C8 sign in. `returnTo` is where to go afterwards (checked by
     * safeCustomerReturnPath); the page's back link and intro follow it
     * (checkout, a menu, or home).
     */
    signIn: (returnTo?: string | null) =>
      returnTo ? `/account/sign-in?${new URLSearchParams({ returnTo })}` : "/account/sign-in",
    /** C8 create an account, with the same `returnTo` as sign-in. */
    signUp: (returnTo?: string | null) =>
      returnTo ? `/account/sign-up?${new URLSearchParams({ returnTo })}` : "/account/sign-up",
    /** C8 "Forgot your password?": no reset without emails yet (undesigned). */
    forgotPassword: "/account/forgot-password",
    /** One of the account's own orders. */
    order: (orderId: string) => `/account/orders/${encodeURIComponent(orderId)}`,
  },
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
    /** A5, owner only. */
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
