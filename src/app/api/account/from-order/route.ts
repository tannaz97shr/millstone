import { fromOrderRequestSchema } from "@/modules/account/lib/accountSchemas";
import { claimOrderAccount } from "@/modules/account/lib/claimOrderAccount";
import { jsonResponse, parseBody, routeHandler } from "@/shared/lib/api/routeHandler";
import { assertSameOrigin } from "@/shared/lib/api/sameOrigin";
import { enforceRateLimit } from "@/shared/lib/rateLimit/rateLimit";
import { RATE_LIMITS } from "@/shared/lib/rateLimit/rateLimitRules";

// C7 "Save your details for next time" (AC-C10). Public: the order's
// unguessable ID is the proof, as for C7 itself. 201 { redirectTo } (C7)
// with the session cookie set, 400 invalid body, 403 cross-site, 404 no such
// order, 409 `already_linked` / `account_exists` / `not_eligible` /
// `window_closed` (planAccountFromOrder), 429 too many from this address
// (counted with sign-ups), 503 Firestore too slow.
export const POST = routeHandler("POST /api/account/from-order", async (request) => {
  assertSameOrigin(request);
  await enforceRateLimit(request, RATE_LIMITS.customerSignUp);
  const body = await parseBody(fromOrderRequestSchema, request);
  return jsonResponse(await claimOrderAccount(body), 201);
});
