import "server-only";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { getOptionalCustomer, type CustomerActor } from "@/modules/auth/lib/requireSession";
import type { OrderId } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { logError } from "@/shared/utils/logError";
import type { AccountOrder } from "../types/accountOrder";
import { getAccountOrder } from "./accountOrders";

export type AccountOrderPageLoad =
  | { kind: "signed_out" }
  /** Not this account's, a guest order, never placed, or missing: one answer for all. */
  | { kind: "not_found" }
  | { kind: "ok"; customer: CustomerActor; order: AccountOrder }
  /** Firestore failed; the browser asks again and shows the error. */
  | { kind: "failed"; customer: CustomerActor };

/**
 * The account order page's server read, once per request: generateMetadata
 * (the tab title names the order) and the page share it through React's cache.
 */
export const loadAccountOrderPage = cache(async (orderId: OrderId): Promise<AccountOrderPageLoad> => {
  const customer = await getOptionalCustomer();
  if (!customer) return { kind: "signed_out" };
  try {
    return { kind: "ok", customer, order: await getAccountOrder(customer.id, orderId) };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError && error.status === 404) return { kind: "not_found" };
    logError(error, `loadAccountOrderPage ${orderId}`, { level: "warn" });
    return { kind: "failed", customer };
  }
});
