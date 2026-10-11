import { safeCustomerReturnPath } from "@/modules/auth/lib/returnPath";
import { routes } from "@/shared/routes";
import type { SignInContext } from "../content/accountContent";

export interface SignInPlace {
  context: SignInContext;
  /** The safe page to go to after signing in (also sent to the server, which checks it again). */
  returnTo: string;
  /** Where C8's back link goes: the page it was opened from. */
  backHref: string;
}

/**
 * Where C8 (sign in, create an account) was opened from, from its `returnTo`:
 * checkout and a menu go back there; a recurring-order page (C1's "Set up a
 * recurring order", AC-R1) says why an account is needed, with "Home" as the
 * back link; anything else (C1, a gated account page, nothing) is "Home".
 */
export function signInPlace(returnTo: string | null | undefined): SignInPlace {
  const safe = safeCustomerReturnPath(returnTo);
  const pathname = safe.split("?")[0];
  const recurring = routes.account.recurring.list;
  if (pathname === routes.checkout) return { context: "checkout", returnTo: safe, backHref: safe };
  if (pathname.startsWith(routes.menu(""))) return { context: "menu", returnTo: safe, backHref: safe };
  if (pathname === recurring || pathname.startsWith(`${recurring}/`)) {
    return { context: "recurring", returnTo: safe, backHref: routes.home };
  }
  return { context: "home", returnTo: safe, backHref: routes.home };
}
