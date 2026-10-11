import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getOptionalCustomer } from "@/modules/auth/lib/requireSession";
import { RecurringDetailScreen } from "@/modules/recurring-orders/components/RecurringDetailScreen";
import { recurringContent } from "@/modules/recurring-orders/content/recurringContent";
import { prefetchRecurringOrder } from "@/modules/recurring-orders/lib/prefetchRecurring";
import { recurringRouteParamsSchema } from "@/modules/recurring-orders/lib/recurringSchemas";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";
import { routes } from "@/shared/routes";

type Props = { params: Promise<{ recurringOrderId: string }> };

export const metadata: Metadata = { title: recurringContent.detail.metadataTitle };

// C12. Someone else's, a missing or a malformed ID is a 404 with the account's
// own wording (not-found.tsx beside this page), as the API answers.
export default async function RecurringOrderPage({ params }: Props) {
  const parsed = recurringRouteParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const { recurringOrderId } = parsed.data;

  const customer = await getOptionalCustomer();
  if (!customer) redirect(routes.account.signIn(routes.account.recurring.detail(recurringOrderId)));

  const queryClient = getQueryClient();
  await prefetchRecurringOrder(queryClient, customer.id, recurringOrderId);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecurringDetailScreen recurringOrderId={recurringOrderId} />
    </HydrationBoundary>
  );
}
