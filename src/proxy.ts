import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/modules/auth/lib/authConfig";
import { safeAdminReturnPath, safeCustomerReturnPath } from "@/modules/auth/lib/returnPath";
import type { PrincipalKind } from "@/modules/auth/types/session";
import { routes } from "@/shared/routes";

// Gates admin and account pages before they render. A lightweight Auth.js
// instance with no providers: it only reads the session token (and drops an
// expired one). It makes no role, branch or account decisions; pages and API
// routes check those themselves. /api is not matched, so every API route
// checks its own session.

const { auth } = NextAuth(authConfig);

const isUnder = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/** A1 and every admin page: staff only. */
function gateAdmin(request: NextRequest, kind: PrincipalKind | undefined): NextResponse {
  const { pathname, search } = request.nextUrl;
  const isStaff = kind === "staff";

  if (pathname === routes.admin.signIn()) {
    if (!isStaff) return NextResponse.next();
    const returnTo = safeAdminReturnPath(request.nextUrl.searchParams.get("returnTo"));
    return NextResponse.redirect(new URL(returnTo, request.nextUrl));
  }
  if (!isStaff) {
    return NextResponse.redirect(new URL(routes.admin.signIn(`${pathname}${search}`), request.nextUrl));
  }
  return NextResponse.next();
}

/**
 * C8 and C9: the sign-in pages are for anyone not signed in as a customer
 * (a staff session counts as signed out here); everything else under
 * /account needs a customer session.
 */
function gateAccount(request: NextRequest, kind: PrincipalKind | undefined): NextResponse {
  const { pathname, search } = request.nextUrl;
  const isCustomer = kind === "customer";

  if (pathname === routes.account.forgotPassword()) return NextResponse.next();
  if (pathname === routes.account.signIn() || pathname === routes.account.signUp()) {
    if (!isCustomer) return NextResponse.next();
    const returnTo = safeCustomerReturnPath(request.nextUrl.searchParams.get("returnTo"));
    return NextResponse.redirect(new URL(returnTo, request.nextUrl));
  }
  if (!isCustomer) {
    return NextResponse.redirect(new URL(routes.account.signIn(`${pathname}${search}`), request.nextUrl));
  }
  return NextResponse.next();
}

export default auth((request) => {
  const kind = request.auth?.principal?.kind;
  if (isUnder(request.nextUrl.pathname, routes.account.home)) return gateAccount(request, kind);
  return gateAdmin(request, kind);
});

export const config = {
  matcher: ["/admin", "/admin/:path*", "/account", "/account/:path*"],
};
