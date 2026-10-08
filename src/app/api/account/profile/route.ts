import { profileFormSchema } from "@/modules/account/lib/accountSchemas";
import { updateProfile } from "@/modules/account/lib/updateProfile";
import { requireCustomerSession } from "@/modules/auth/lib/requireSession";
import { jsonResponse, parseBody, routeHandler } from "@/shared/lib/api/routeHandler";
import { assertSameOrigin } from "@/shared/lib/api/sameOrigin";
import { enforceRateLimit } from "@/shared/lib/rateLimit/rateLimit";
import { RATE_LIMITS } from "@/shared/lib/rateLimit/rateLimitRules";

// C9 "Save details". Customers only: 200 the saved profile, 400 invalid
// body, 401 signed out, 403 a staff session or cross-site, 409 `email_taken`
// (another account has that email), 429 too many from this address.
export const PATCH = routeHandler("PATCH /api/account/profile", async (request) => {
  assertSameOrigin(request);
  const customer = await requireCustomerSession();
  await enforceRateLimit(request, RATE_LIMITS.accountWrite);
  const body = await parseBody(profileFormSchema, request);
  return jsonResponse(await updateProfile(customer.id, body));
});
