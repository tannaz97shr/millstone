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
 * checkout and a menu go back there; anything else (C1, a gated account
 * page, nothing) is "Home".
 */
export function signInPlace(returnTo: string | null | undefined): SignInPlace {
  const safe = safeCustomerReturnPath(returnTo);
  const pathname = safe.split("?")[0];
  if (pathname === routes.checkout) return { context: "checkout", returnTo: safe, backHref: safe };
  if (pathname.startsWith(routes.menu(""))) return { context: "menu", returnTo: safe, backHref: safe };
  return { context: "home", returnTo: safe, backHref: routes.home };
}
