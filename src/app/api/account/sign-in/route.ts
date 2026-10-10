import { customerSignInRequestSchema } from "@/modules/account/lib/accountSchemas";
import { signInCustomer } from "@/modules/auth/lib/signInCustomer";
import { jsonResponse, parseBody, routeHandler } from "@/shared/lib/api/routeHandler";
import { assertSameOrigin } from "@/shared/lib/api/sameOrigin";
import { enforceRateLimit } from "@/shared/lib/rateLimit/rateLimit";
import { RATE_LIMITS } from "@/shared/lib/rateLimit/rateLimitRules";

// C8 sign in. Public: this is how a customer session starts, replacing any
// session already in this browser (staff included). 200 { redirectTo } with
// the session cookie set, 400 invalid body, 401 invalid_credentials (never
// says whether the email, the password, or a guest-only email was the
// problem), 403 cross-site, 429 locked (`too_many_attempts`, this email) or
// too many tries from this address (`rate_limited`). Cross-site requests are
// refused before they're counted.
export const POST = routeHandler("POST /api/account/sign-in", async (request) => {
  assertSameOrigin(request);
  await enforceRateLimit(request, RATE_LIMITS.customerSignIn);
  const body = await parseBody(customerSignInRequestSchema, request);
  return jsonResponse(await signInCustomer(body));
});
