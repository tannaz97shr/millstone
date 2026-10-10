import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { unstable_rethrow } from "next/navigation";
import type { CustomerId, OrderId } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { logError } from "@/shared/utils/logError";
import { accountKeys } from "../api/queryKeys";
import { getAccountOrder, listAccountOrders } from "./accountOrders";

/** Server-side fill of C9's orders. A failure is logged and left to the browser, which asks again. */
export async function prefetchAccountOrders(queryClient: QueryClient, customerId: CustomerId): Promise<void> {
  try {
    queryClient.setQueryData(accountKeys.orders(), await listAccountOrders(customerId));
  } catch (error) {
    // Next.js signals (dynamic rendering, redirects) must reach the framework.
    unstable_rethrow(error);
    logError(error, "prefetchAccountOrders", { level: "warn" });
  }
}

/** Server-side fill of one account order; "not_found" lets the page show the site's 404. */
export async function prefetchAccountOrder(
  queryClient: QueryClient,
  customerId: CustomerId,
  orderId: OrderId,
): Promise<"ok" | "not_found" | "failed"> {
  try {
    queryClient.setQueryData(accountKeys.order(orderId), await getAccountOrder(customerId, orderId));
    return "ok";
  } catch (error) {
    // Next.js signals (dynamic rendering, redirects) must reach the framework.
    unstable_rethrow(error);
    if (error instanceof ApiError && error.status === 404) return "not_found";
    logError(error, `prefetchAccountOrder ${orderId}`, { level: "warn" });
    return "failed";
  }
}
