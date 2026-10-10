import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { unstable_rethrow } from "next/navigation";
import { getOptionalCustomer } from "@/modules/auth/lib/requireSession";
import { logError } from "@/shared/utils/logError";
import { accountKeys } from "../api/queryKeys";
import type { AccountSessionResponse } from "../types/accountSession";
import { toAccountProfile } from "./toAccountProfile";

/**
 * Server-side fill of the session query for the customer layout. A failure
 * is logged and left to the browser, which asks again: the page still
 * renders, as a guest until it knows.
 */
export async function prefetchAccountSession(queryClient: QueryClient): Promise<void> {
  try {
    const customer = await getOptionalCustomer();
    const data: AccountSessionResponse = { customer: customer && toAccountProfile(customer) };
    queryClient.setQueryData(accountKeys.session(), data);
  } catch (error) {
    // Next.js signals (dynamic rendering, redirects) must reach the framework.
    unstable_rethrow(error);
    logError(error, "prefetchAccountSession", { level: "warn" });
  }
}
