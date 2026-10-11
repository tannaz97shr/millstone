import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getOptionalCustomer } from "@/modules/auth/lib/requireSession";
import { prefetchBranches } from "@/modules/branches/lib/prefetchBranches";
import { RecurringEditScreen } from "@/modules/recurring-orders/components/RecurringFormScreen";
import { recurringContent } from "@/modules/recurring-orders/content/recurringContent";
import { prefetchRecurringOrder } from "@/modules/recurring-orders/lib/prefetchRecurring";
import { recurringRouteParamsSchema } from "@/modules/recurring-orders/lib/recurringSchemas";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";
import { routes } from "@/shared/routes";

type Props = { params: Promise<{ recurringOrderId: string }> };

export const metadata: Metadata = { title: recurringContent.form.metadataTitleEdit };

// C11 edit. The branch is locked (AC-R4); the API checks everything again.
export default async function EditRecurringOrderPage({ params }: Props) {
  const parsed = recurringRouteParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const { recurringOrderId } = parsed.data;

  const customer = await getOptionalCustomer();
  if (!customer) redirect(routes.account.signIn(routes.account.recurring.edit(recurringOrderId)));

  const queryClient = getQueryClient();
  await Promise.all([
    prefetchRecurringOrder(queryClient, customer.id, recurringOrderId),
    prefetchBranches(queryClient, new Date()),
  ]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecurringEditScreen recurringOrderId={recurringOrderId} />
    </HydrationBoundary>
  );
}
