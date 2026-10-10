import { toAccountProfile } from "@/modules/account/lib/toAccountProfile";
import type { AccountSessionResponse } from "@/modules/account/types/accountSession";
import { getOptionalCustomer } from "@/modules/auth/lib/requireSession";
import { jsonResponse, routeHandler } from "@/shared/lib/api/routeHandler";

// Who's signed in on the customer site: the header, the cart's owner and
// C5's prefill. Always 200: { customer } for a customer, { customer: null }
// for a guest or a staff session. Details are read fresh from Firestore.
export const GET = routeHandler("GET /api/account/session", async () => {
  const customer = await getOptionalCustomer();
  const body: AccountSessionResponse = { customer: customer && toAccountProfile(customer) };
  return jsonResponse(body);
});
