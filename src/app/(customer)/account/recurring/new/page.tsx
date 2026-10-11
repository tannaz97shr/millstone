import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOptionalCustomer } from "@/modules/auth/lib/requireSession";
import { prefetchBranches } from "@/modules/branches/lib/prefetchBranches";
import { RecurringNewScreen } from "@/modules/recurring-orders/components/RecurringFormScreen";
import { recurringContent } from "@/modules/recurring-orders/content/recurringContent";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";
import { routes } from "@/shared/routes";

export const metadata: Metadata = { title: recurringContent.form.metadataTitleNew };

// C11 new. Signed in only (AC-R1): proxy.ts sends a guest to C8, which says why.
export default async function NewRecurringOrderPage() {
  const customer = await getOptionalCustomer();
  if (!customer) redirect(routes.account.signIn(routes.account.recurring.new));

  const queryClient = getQueryClient();
  await prefetchBranches(queryClient, new Date());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecurringNewScreen />
    </HydrationBoundary>
  );
}
