import "server-only";
import { STAFF_PROVIDER_ID } from "./authConfig";
import { safeAdminReturnPath } from "./returnPath";
import type { SignInResponse } from "./signInSchema";
import { signInWithProvider } from "./signInWithProvider";

interface SignInStaffInput {
  email: string;
  password: string;
  returnTo?: string;
}

/**
 * Signs a staff member in and sets the session cookie. A wrong email or
 * password is one 401 (never says which); a locked email is 429.
 */
export async function signInStaff({ email, password, returnTo }: SignInStaffInput): Promise<SignInResponse> {
  const redirectTo = safeAdminReturnPath(returnTo);
  await signInWithProvider(STAFF_PROVIDER_ID, { email, password }, redirectTo);
  return { redirectTo };
}
