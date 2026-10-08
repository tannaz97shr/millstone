import "server-only";
import { CUSTOMER_PROVIDER_ID } from "./authConfig";
import { safeCustomerReturnPath } from "./returnPath";
import { clearSignInFailures } from "./signInThrottle";
import { signInWithProvider } from "./signInWithProvider";

interface SignInCustomerInput {
  email: string;
  password: string;
  returnTo?: string;
}

/**
 * Signs a customer in and sets the session cookie (C8). A wrong email or
 * password, or a guest email with no account, is one 401 (never says which);
 * a locked email is 429. Answers with the safe page to open next.
 */
export async function signInCustomer({ email, password, returnTo }: SignInCustomerInput): Promise<{ redirectTo: string }> {
  const redirectTo = safeCustomerReturnPath(returnTo);
  await signInWithProvider(CUSTOMER_PROVIDER_ID, { email, password }, redirectTo);
  return { redirectTo };
}

/**
 * Signs in an account that was given its password just now (sign-up, C7's
 * save). Earlier failed tries for the email are cleared first: they guessed
 * at a password that didn't exist, and mustn't lock out the person who just
 * set one.
 */
export async function signInNewAccount(input: SignInCustomerInput & { normalizedEmail: string }) {
  await clearSignInFailures("customer", input.normalizedEmail);
  return signInCustomer(input);
}
