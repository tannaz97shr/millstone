import "server-only";
import type { z } from "zod";
import { signInNewAccount } from "@/modules/auth/lib/signInCustomer";
import { setCustomerPassword } from "@/modules/customers/lib/customerAccount";
import { readCustomerIdByEmail } from "@/modules/customers/lib/guestCustomer";
import { toCustomer } from "@/modules/customers/lib/toCustomer";
import { toOrder } from "@/modules/orders/lib/toOrder";
import { ApiError } from "@/shared/lib/api/apiError";
import { getDb } from "@/shared/lib/firebase/admin";
import { customersRef, ordersRef } from "@/shared/lib/firebase/collections";
import { hashPassword } from "@/shared/lib/password";
import { routes } from "@/shared/routes";
import { withDeadline } from "@/shared/utils/withDeadline";
import type { AccountRedirectResponse, fromOrderRequestSchema } from "./accountSchemas";
import { planAccountFromOrder, type AccountFromOrderRefusal } from "./planAccountFromOrder";
import { ACCOUNT_WRITE_DEADLINE_MS } from "./signUpCustomer";

const REFUSALS: Record<AccountFromOrderRefusal, string> = {
  already_linked: "This order is already in an account",
  account_exists: "There's already an account for this order's email",
  not_eligible: "This order can't be saved to an account",
  window_closed: "This order's pickup day has passed",
};

/**
 * C7 "Save your details for next time" (AC-C10): the guest's customer record
 * becomes an account with this password and the order's name and mobile, the
 * order goes into its history, and the browser is signed in. The rules
 * (planAccountFromOrder) are checked again inside the transaction. A refusal
 * is 409 with the reason as its code; a missing order is 404, like C7's.
 */
export async function claimOrderAccount(
  request: z.output<typeof fromOrderRequestSchema>,
): Promise<AccountRedirectResponse> {
  const { orderId, password } = request;
  const passwordHash = await hashPassword(password);
  const orderRef = ordersRef().doc(orderId);

  const transaction = getDb().runTransaction(async (tx) => {
    const orderSnapshot = await tx.get(orderRef);
    if (!orderSnapshot.exists) throw new ApiError(404, "not_found", "No such order");
    const order = toOrder(orderSnapshot);
    const customerSnapshot = order.customerId ? await tx.get(customersRef().doc(order.customerId)) : null;
    const customer = customerSnapshot?.exists ? toCustomer(customerSnapshot) : null;
    const lockOwner = customer ? await readCustomerIdByEmail(tx, customer.email) : null;

    const plan = planAccountFromOrder({
      order,
      customer: customer && { passwordHash: customer.passwordHash, ownsEmail: lockOwner === customer.id },
      now: new Date(),
    });
    if (plan.kind === "refuse") throw new ApiError(409, plan.reason, REFUSALS[plan.reason]);
    if (!customer || order.customerId === null) throw new Error("planAccountFromOrder offered with no customer");

    setCustomerPassword(tx, order.customerId, { name: order.contactName, phone: order.contactPhone }, passwordHash);
    tx.update(orderRef, { accountId: order.customerId });
    return customer.email;
  });
  const email = await withDeadline(
    transaction,
    ACCOUNT_WRITE_DEADLINE_MS,
    () => new ApiError(503, "unavailable", `Saving the account took over ${ACCOUNT_WRITE_DEADLINE_MS}ms`),
  );

  // C7 stays open and shows "Your account is set up".
  return signInNewAccount({ email, password, returnTo: routes.orderConfirmation(orderId), normalizedEmail: email });
}
