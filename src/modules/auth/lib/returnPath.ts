import { routes } from "@/shared/routes";
import { logError } from "@/shared/utils/logError";

// Where to go after signing in. Only a path inside the admin on this site is
// accepted, so a crafted sign-in link can't send staff anywhere else.

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
