import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import type { StaffActor } from "@/modules/auth/lib/requireSession";
import type { OrderId } from "@/shared/domain";
import { adminOrderKeys } from "../api/queryKeys";
import { getAdminOrder } from "./getAdminOrder";
import { listAdminOrders } from "./listAdminOrders";
import type { AdminOrderFilters } from "./orderFilters";

/**
 * Server-side fill of the queries A2 makes through GET /api/admin/orders (and
 * the open order's detail). A failure is left for the browser to retry and show.
 */
export async function prefetchAdminOrders(
  queryClient: QueryClient,
  actor: StaffActor,
  filters: AdminOrderFilters,
  openOrderId: OrderId | null,
  now: Date,
): Promise<void> {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: adminOrderKeys.list(filters),
      queryFn: () => listAdminOrders(actor, filters, now),
    }),
    openOrderId &&
      queryClient.prefetchQuery({
        queryKey: adminOrderKeys.detail(openOrderId),
        queryFn: () => getAdminOrder(actor, openOrderId),
      }),
  ]);
}
