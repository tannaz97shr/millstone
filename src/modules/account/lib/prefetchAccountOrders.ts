import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { unstable_rethrow } from "next/navigation";
import type { CustomerId } from "@/shared/domain";
import { logError } from "@/shared/utils/logError";
import { accountKeys } from "../api/queryKeys";
import { listAccountOrders } from "./accountOrders";

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

