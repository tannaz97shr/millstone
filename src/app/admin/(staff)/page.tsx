import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { connection } from "next/server";
import { AdminOrdersScreen } from "@/modules/admin-orders/components/AdminOrdersScreen";
import { adminOrderIdParam } from "@/modules/admin-orders/lib/adminOrderParams";
import { filtersFromUrl } from "@/modules/admin-orders/lib/orderFilters";
import { prefetchAdminOrders } from "@/modules/admin-orders/lib/prefetchAdminOrders";
import { getStaffPageSession } from "@/modules/auth/lib/staffPageSession";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";

export interface AdminOrdersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// A2 (and A3 when ?order= is set). Rendered per request: the list depends on
// the clock and on who is signed in. The server fills the same queries the
// browser then refreshes every 30 seconds.
export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  await connection();
  const actor = await getStaffPageSession();
  const owner = actor.role === "owner";
  const params = await searchParams;
  const read = filtersFromUrl(params);
  const filters = owner ? read : { ...read, branch: null };
  const order = adminOrderIdParam.safeParse(Array.isArray(params.order) ? params.order[0] : params.order);

  const queryClient = getQueryClient();
  await prefetchAdminOrders(queryClient, actor, filters, order.success ? order.data : null, new Date());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminOrdersScreen owner={owner} />
    </HydrationBoundary>
  );
}
