import "server-only";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findCustomerByEmail, hasAccount } from "@/modules/customers/lib/findCustomer";
import { findStaffUserByEmail } from "@/modules/staff/lib/findStaffUser";
import { normalizeEmail } from "@/shared/lib/firebase/fieldSchemas";
import { hashPassword, verifyPassword } from "@/shared/lib/password";
import { logError } from "@/shared/utils/logError";
import type { CustomerPrincipal, StaffPrincipal } from "../types/session";
import { authConfig, CUSTOMER_PROVIDER_ID, STAFF_PROVIDER_ID } from "./authConfig";
import { signInFormSchema } from "./signInSchema";
import { clearSignInFailures, isSignInLocked, recordSignInFailure } from "./signInThrottle";

// The full Auth.js instance: the staff (A1) and customer (C8) credentials
// providers, which read Firestore. Server only; proxy.ts uses authConfig on
// its own.

/** The email is locked after too many failures (A1 and C8 throttle). */
export class TooManyAttemptsError extends CredentialsSignin {
  code = "too_many_attempts";
}

// Unknown emails still pay for one scrypt run, so timing doesn't say whether
// an account exists. The hash is made once, with the real parameters.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword("not-a-real-password"));

async function authorizeStaff(credentials: unknown): Promise<{ principal: StaffPrincipal; name: string } | null> {
  const parsed = signInFormSchema.safeParse(credentials);
  if (!parsed.success) return null;
  const email = normalizeEmail(parsed.data.email);
  const now = new Date();

  if (await isSignInLocked("staff", email, now)) throw new TooManyAttemptsError();

  const staff = await findStaffUserByEmail(email);
  const matches = await verifyPassword(parsed.data.password, staff?.passwordHash ?? (await getDummyHash()));

  if (!staff || !matches) {
    await recordSignInFailure("staff", email, now);
    return null;
  }
  await clearSignInFailures("staff", email);
  return {
    name: staff.name,
    principal: {
      kind: "staff",
      id: staff.id,
      name: staff.name,
      role: staff.role,
      branchId: staff.branchId,
    },
  };
}

/**
 * A customer with an account. A guest record (no password) is refused like an
 * unknown email, after the same scrypt run, so neither says the email has
 * ordered before.
 */
async function authorizeCustomer(
  credentials: unknown,
): Promise<{ principal: CustomerPrincipal; name: string } | null> {
  const parsed = signInFormSchema.safeParse(credentials);
  if (!parsed.success) return null;
  const email = normalizeEmail(parsed.data.email);
  const now = new Date();

  if (await isSignInLocked("customer", email, now)) throw new TooManyAttemptsError();

  const customer = await findCustomerByEmail(email);
  const account = hasAccount(customer) ? customer : null;
  const matches = await verifyPassword(parsed.data.password, account?.passwordHash ?? (await getDummyHash()));

  if (!account || !matches) {
    await recordSignInFailure("customer", email, now);
    return null;
  }
  await clearSignInFailures("customer", email);
  return { name: account.name, principal: { kind: "customer", id: account.id, name: account.name } };
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: STAFF_PROVIDER_ID,
      credentials: { email: {}, password: {} },
      authorize: authorizeStaff,
    }),
    Credentials({
      id: CUSTOMER_PROVIDER_ID,
      credentials: { email: {}, password: {} },
      authorize: authorizeCustomer,
    }),
  ],
  logger: {
    // A wrong password is expected, not a server error.
    error(error) {
      const expected = error instanceof CredentialsSignin;
      logError(error, "auth", { level: expected ? "warn" : "error" });
    },
  },
});
