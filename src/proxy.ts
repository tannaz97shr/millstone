import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/modules/auth/lib/authConfig";
import { safeAdminReturnPath } from "@/modules/auth/lib/returnPath";
import { routes } from "@/shared/routes";

// Gates admin pages before they render. A lightweight Auth.js instance with no
// providers: it only reads the session token (and drops an expired one). It
// makes no role or branch decisions; pages and API routes check those
// themselves. /api is not matched, so every API route checks its own session.

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { pathname, search } = request.nextUrl;
  const signInPath = routes.admin.signIn();
  const isStaff = request.auth?.principal?.kind === "staff";

  if (pathname === signInPath) {
    if (!isStaff) return NextResponse.next();
    const returnTo = safeAdminReturnPath(request.nextUrl.searchParams.get("returnTo"));
    return NextResponse.redirect(new URL(returnTo, request.nextUrl));
  }

  if (!isStaff) {
    return NextResponse.redirect(new URL(routes.admin.signIn(`${pathname}${search}`), request.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
