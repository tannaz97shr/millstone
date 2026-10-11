import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { notFound, unstable_rethrow } from "next/navigation";
import type { CustomerId } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { logError } from "@/shared/utils/logError";
import { recurringKeys } from "../api/queryKeys";
import { getRecurringOrderDetail, listRecurringOrders } from "./recurringOrderReads";

/** Server-side fill of C10's (and C9's) list. A failure is logged and left to the browser, which asks again. */
export async function prefetchRecurringOrders(queryClient: QueryClient, customerId: CustomerId): Promise<void> {
  try {
    queryClient.setQueryData(recurringKeys.list(), await listRecurringOrders(customerId, new Date()));
  } catch (error) {
    // Next.js signals (dynamic rendering, redirects) must reach the framework.
    unstable_rethrow(error);
    logError(error, "prefetchRecurringOrders", { level: "warn" });
  }
}

/**
 * Server-side fill of C12 and C11 edit. Someone else's, a missing or a
 * malformed ID is the page's 404 (as the API answers); any other failure is
 * left to the browser.
 */
export async function prefetchRecurringOrder(
  queryClient: QueryClient,
  customerId: CustomerId,
  recurringOrderId: string,
): Promise<void> {
  try {
    queryClient.setQueryData(
      recurringKeys.detail(recurringOrderId),
      await getRecurringOrderDetail(customerId, recurringOrderId, new Date()),
    );
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError && error.status === 404) notFound();
    logError(error, "prefetchRecurringOrder", { level: "warn" });
  }
}
