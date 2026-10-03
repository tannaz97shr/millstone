import { signInRequestSchema } from "@/modules/auth/lib/signInSchema";
import { signInStaff } from "@/modules/auth/lib/signInStaff";
import { jsonResponse, parseBody, routeHandler } from "@/shared/lib/api/routeHandler";
import { assertSameOrigin } from "@/shared/lib/api/sameOrigin";

// A1. Public: this is how a session starts. 200 { redirectTo } with the
// session cookie set, 400 invalid body, 401 invalid_credentials (email and
// password don't match; never says which), 403 cross-site, 429 locked.
export const POST = routeHandler("POST /api/admin/sign-in", async (request) => {
  assertSameOrigin(request);
  const body = await parseBody(signInRequestSchema, request);
  return jsonResponse(await signInStaff(body));
});
