import { signUpRequestSchema } from "@/modules/account/lib/accountSchemas";
import { signUpCustomer } from "@/modules/account/lib/signUpCustomer";
import { jsonResponse, parseBody, routeHandler } from "@/shared/lib/api/routeHandler";
import { assertSameOrigin } from "@/shared/lib/api/sameOrigin";
import { enforceRateLimit } from "@/shared/lib/rateLimit/rateLimit";
import { RATE_LIMITS } from "@/shared/lib/rateLimit/rateLimitRules";

// C8 create an account (AC-U1), then signed in. Public. 201 { redirectTo }
// with the session cookie set, 400 invalid body, 403 cross-site, 409
// `email_taken` (the email already has an account; a guest's email becomes
// the account), 429 too many from this address, 503 Firestore too slow.
export const POST = routeHandler("POST /api/account/sign-up", async (request) => {
  assertSameOrigin(request);
  await enforceRateLimit(request, RATE_LIMITS.customerSignUp);
  const body = await parseBody(signUpRequestSchema, request);
  return jsonResponse(await signUpCustomer(body), 201);
});
