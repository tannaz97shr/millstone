import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AccountOrderScreen } from "@/modules/account/components/AccountOrderScreen";
import { accountContent } from "@/modules/account/content/accountContent";
import { prefetchAccountOrder } from "@/modules/account/lib/prefetchAccountOrders";
import { getOptionalCustomer } from "@/modules/auth/lib/requireSession";
import { anyOrderRouteParamsSchema } from "@/modules/orders/lib/orderParams";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";
import { routes } from "@/shared/routes";

export const metadata: Metadata = { title: accountContent.myAccount.metadataTitle };

// One of the signed-in customer's own orders (undesigned page). Anyone else's
// order, a guest order or a malformed ID is the site's 404, as for C7.
export default async function AccountOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const parsed = anyOrderRouteParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const { orderId } = parsed.data;
  const customer = await getOptionalCustomer();
  if (!customer) redirect(routes.account.signIn(routes.account.order(orderId)));

  const queryClient = getQueryClient();
  if ((await prefetchAccountOrder(queryClient, customer.id, orderId)) === "not_found") notFound();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AccountOrderScreen orderId={orderId} />
    </HydrationBoundary>
  );
}
