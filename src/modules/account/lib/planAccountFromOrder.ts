import type { Order } from "@/shared/domain";
import { melbourneDateOf } from "@/shared/utils/pickup-dates";

// C7's "Save your details for next time" (AC-C10): when a guest order may
// become an account. The order's unguessable link is the only proof the
// customer gives, so the offer is narrow:
// - a placed order (not waiting for payment, expired or cancelled);
// - not already in an account's history;
// - its customer has no password yet (a guest record);
// - until the end of its pickup day, Melbourne time, so a link forwarded or
//   found later can't be used to take over the email.
// Signed-in viewers never see it; that's checked where the session is known.

const OFFER_STATUSES: ReadonlySet<Order["status"]> = new Set(["placed", "ready", "collected"]);

export type AccountFromOrderRefusal =
  /** The order is already in an account's history. */
  | "already_linked"
  /** The email already has an account: sign in instead. */
  | "account_exists"
  /** Not a placed order, or no customer record to make the account from. */
  | "not_eligible"
  /** The pickup day has passed. */
  | "window_closed";

export type AccountFromOrderPlan = { kind: "offer" } | { kind: "refuse"; reason: AccountFromOrderRefusal };

export interface AccountFromOrderInput {
  order: Pick<Order, "status" | "accountId" | "customerId" | "pickupDate">;
  /**
   * The order's customer record, or null when it's gone. `ownsEmail` is
   * false once its email's lock points at another customer (an account took
   * the email in a profile edit), so that account is the email's owner now.
   */
  customer: { passwordHash: string | null; ownsEmail: boolean } | null;
  now: Date;
}

export function planAccountFromOrder({ order, customer, now }: AccountFromOrderInput): AccountFromOrderPlan {
  if (order.accountId !== null) return { kind: "refuse", reason: "already_linked" };
  if (!OFFER_STATUSES.has(order.status) || order.customerId === null || customer === null) {
    return { kind: "refuse", reason: "not_eligible" };
  }
  if (customer.passwordHash !== null || !customer.ownsEmail) return { kind: "refuse", reason: "account_exists" };
  // ISO dates compare as strings. The pickup day itself still counts.
  if (melbourneDateOf(now) > order.pickupDate) return { kind: "refuse", reason: "window_closed" };
  return { kind: "offer" };
}
