import { signOut } from "@/modules/auth/lib/auth";
import { jsonResponse, routeHandler } from "@/shared/lib/api/routeHandler";
import { assertSameOrigin } from "@/shared/lib/api/sameOrigin";

// C9 "Sign out": ends the session (clears the cookie). Safe to call without
// one: 200 either way.
export const POST = routeHandler("POST /api/account/sign-out", async (request) => {
  assertSameOrigin(request);
  await signOut({ redirect: false });
  return jsonResponse(null, 200);
});
