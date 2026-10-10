import "server-only";
import { AuthError, CredentialsSignin } from "next-auth";
import { ApiError } from "@/shared/lib/api/apiError";
import { signIn } from "./auth";
import type { CUSTOMER_PROVIDER_ID, STAFF_PROVIDER_ID } from "./authConfig";

type ProviderId = typeof STAFF_PROVIDER_ID | typeof CUSTOMER_PROVIDER_ID;

const TOO_MANY_ATTEMPTS = "too_many_attempts";

const invalidCredentials = () => new ApiError(401, "invalid_credentials", "Email and password don't match");
const tooManyAttempts = () => new ApiError(429, "too_many_attempts", "Too many failed sign-ins for this email");

/**
 * What Auth.js's signIn() returned, as an error, or null for a real success.
 * A refusal reaches us one of two ways in this beta: thrown as
 * CredentialsSignin, or returned as the URL of its error page,
 * `…/error?error=CredentialsSignin&code=…`. Success is only the redirect to
 * the page we asked for; anything else (e.g. a missing AUTH_SECRET, where
 * Auth.js answers with no redirect at all) is a server problem, never a
 * signed-in session.
 */
function outcomeOf(returned: unknown, redirectTo: string): ApiError | null {
  if (typeof returned !== "string") return new ApiError(500, "server_error", "Sign-in returned no URL");
  let url: URL;
  try {
    url = new URL(returned, "http://millstone.invalid");
  } catch (error) {
    return new ApiError(500, "server_error", `Unreadable sign-in result (${String(error)})`);
  }
  const error = url.searchParams.get("error");
  if (error === "CredentialsSignin") {
    return url.searchParams.get("code") === TOO_MANY_ATTEMPTS ? tooManyAttempts() : invalidCredentials();
  }
  if (error) return new ApiError(500, "server_error", `Sign-in failed: ${error}`);
  if (`${url.pathname}${url.search}` !== redirectTo) {
    return new ApiError(500, "server_error", `Sign-in didn't complete (Auth.js returned ${url.pathname})`);
  }
  return null;
}

/**
 * Signs in with one of our credentials providers and sets the session cookie.
 * `redirectTo` must already be a checked, safe path. A wrong email or
 * password is one 401 (never says which); a locked email is 429.
 */
export async function signInWithProvider(
  providerId: ProviderId,
  credentials: { email: string; password: string },
  redirectTo: string,
): Promise<void> {
  let returned: unknown;
  try {
    returned = await signIn(providerId, { ...credentials, redirect: false, redirectTo });
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      throw error.code === TOO_MANY_ATTEMPTS ? tooManyAttempts() : invalidCredentials();
    }
    // A Firestore timeout inside authorize() arrives wrapped by Auth.js.
    const cause = error instanceof AuthError ? (error.cause as { err?: unknown } | undefined)?.err : undefined;
    if (cause instanceof ApiError) throw cause;
    throw error;
  }
  const problem = outcomeOf(returned, redirectTo);
  if (problem) throw problem;
}
