import { routes } from "@/shared/routes";
import { logError } from "@/shared/utils/logError";

// Where to go after signing in. Staff: only a path inside the admin on this
// site. Customers: only a customer page on this site. A crafted sign-in link
// can't send anyone anywhere else.

const ADMIN_PREFIX = routes.admin.home;
const PLACEHOLDER_ORIGIN = "http://millstone.invalid";

export function safeAdminReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return routes.admin.home;
  }
  let url: URL;
  try {
    url = new URL(value, PLACEHOLDER_ORIGIN);
  } catch (error) {
    logError(error, "safeAdminReturnPath", { level: "warn" });
    return routes.admin.home;
  }
  const inAdmin = url.pathname === ADMIN_PREFIX || url.pathname.startsWith(`${ADMIN_PREFIX}/`);
  const isSignIn = url.pathname === routes.admin.signIn();
  if (url.origin !== PLACEHOLDER_ORIGIN || !inAdmin || isSignIn) return routes.admin.home;
  return `${url.pathname}${url.search}`;
}

const isUnder = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/** Customer pages a sign-in must never land on: the admin, the API and the sign-in pages themselves. */
const CUSTOMER_EXCLUDED = [routes.admin.home, "/api", routes.account.signIn(), routes.account.signUp(), routes.account.forgotPassword];

/**
 * Where a customer goes after signing in or creating an account: any page of
 * the customer site, else My account. Never another site, the admin or the API.
 */
export function safeCustomerReturnPath(value: string | null | undefined): string {
  const fallback = routes.account.home;
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  let url: URL;
  try {
    url = new URL(value, PLACEHOLDER_ORIGIN);
  } catch (error) {
    logError(error, "safeCustomerReturnPath", { level: "warn" });
    return fallback;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return fallback;
  if (CUSTOMER_EXCLUDED.some((prefix) => isUnder(url.pathname, prefix))) return fallback;
  return `${url.pathname}${url.search}`;
}
