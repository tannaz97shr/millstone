import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import type { OrderId } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { logError } from "@/shared/utils/logError";
import { orderKeys } from "../api/queryKeys";
import { getOrderConfirmation } from "./getOrderConfirmation";

/**
 * Server-side fill of C7's query. Returns "not_found" for an order that
 * doesn't exist (or isn't confirmed), so the page can 404. Any other failure
 * is logged and left to the browser, which asks again and shows the error.
 */
export async function prefetchOrderConfirmation(
  queryClient: QueryClient,
  orderId: OrderId,
): Promise<"ok" | "not_found" | "failed"> {
  try {
    queryClient.setQueryData(orderKeys.confirmation(orderId), await getOrderConfirmation(orderId));
    return "ok";
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return "not_found";
    logError(error, `prefetchOrderConfirmation ${orderId}`, { level: "warn" });
    return "failed";
  }
}
