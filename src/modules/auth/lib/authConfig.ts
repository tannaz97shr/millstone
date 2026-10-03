import type { NextAuthConfig } from "next-auth";
import { routes } from "@/shared/routes";
import { isSessionExpired, SESSION_MAX_AGE_SECONDS } from "./sessionPolicy";

// Auth.js settings shared by the full instance (auth.ts) and the lightweight
// one in proxy.ts. No providers and no Firebase here, so the proxy stays
// small; everything that touches Firestore lives in auth.ts.

export const STAFF_PROVIDER_ID = "staff-credentials";

export const authConfig = {
  providers: [],
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  jwt: { maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: routes.admin.signIn() },
  callbacks: {
    jwt({ token, user }) {
      if (user?.principal) {
        // Only at sign-in: `user` is what authorize() returned.
        token.principal = user.principal;
        token.signedInAt = Date.now();
      }
      // Fixed lifetime from sign-in: Auth.js re-issues the cookie on use, so
      // its own maxAge alone would slide. Null ends the session.
      if (isSessionExpired(token.signedInAt, Date.now())) return null;
      return token;
    },
    session({ session, token }) {
      session.principal = token.principal;
      return session;
    },
  },
} satisfies NextAuthConfig;
