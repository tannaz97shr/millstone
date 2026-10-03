import type { SessionPrincipal } from "./session";

// Our own fields on Auth.js's types. `principal` sits beside Auth.js's
// `user` (name, email, image) rather than replacing it.

declare module "next-auth" {
  interface User {
    principal?: SessionPrincipal;
  }

  interface Session {
    principal?: SessionPrincipal;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    principal?: SessionPrincipal;
    /** Epoch milliseconds of sign-in; the session ends a fixed time after it. */
    signedInAt?: number;
  }
}
