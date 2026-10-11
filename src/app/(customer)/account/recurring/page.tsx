import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOptionalCustomer } from "@/modules/auth/lib/requireSession";
import { prefetchBranches } from "@/modules/branches/lib/prefetchBranches";
import { RecurringListScreen } from "@/modules/recurring-orders/components/RecurringListScreen";
import { recurringContent } from "@/modules/recurring-orders/content/recurringContent";
import { prefetchRecurringOrders } from "@/modules/recurring-orders/lib/prefetchRecurring";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";
import { routes } from "@/shared/routes";

export const metadata: Metadata = { title: recurringContent.list.metadataTitle };

// C10. proxy.ts sends anyone who isn't a signed-in customer to C8 first; this
// catches an account gone since. The data itself is guarded by the API.
export default async function RecurringOrdersPage() {
  const customer = await getOptionalCustomer();
  if (!customer) redirect(routes.account.signIn(routes.account.recurring.list));

  const queryClient = getQueryClient();
  await Promise.all([prefetchRecurringOrders(queryClient, customer.id), prefetchBranches(queryClient, new Date())]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecurringListScreen />
    </HydrationBoundary>
  );
}
