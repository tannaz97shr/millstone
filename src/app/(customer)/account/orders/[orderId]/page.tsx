import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { accountKeys } from "@/modules/account/api/queryKeys";
import { AccountOrderScreen } from "@/modules/account/components/AccountOrderScreen";
import { accountContent } from "@/modules/account/content/accountContent";
import { loadAccountOrderPage } from "@/modules/account/lib/loadAccountOrderPage";
import { anyOrderRouteParamsSchema } from "@/modules/orders/lib/orderParams";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";
import { routes } from "@/shared/routes";

type Props = { params: Promise<{ orderId: string }> };

/** The tab names the order ("Order MS-1081 · Millstone") once it's known to be this account's. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parsed = anyOrderRouteParamsSchema.safeParse(await params);
  const load = parsed.success ? await loadAccountOrderPage(parsed.data.orderId) : null;
  return {
    title:
      load?.kind === "ok"
        ? accountContent.order.metadataTitle(load.order.orderNumber)
        : accountContent.myAccount.metadataTitle,
  };
}

// One of the signed-in customer's own orders (undesigned page). Anyone else's
// order, a guest order or a malformed ID is a 404 with the account's own
// wording (not-found.tsx beside this page).
export default async function AccountOrderPage({ params }: Props) {
  const parsed = anyOrderRouteParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const { orderId } = parsed.data;

  const load = await loadAccountOrderPage(orderId);
  if (load.kind === "signed_out") redirect(routes.account.signIn(routes.account.order(orderId)));
  if (load.kind === "not_found") notFound();

  const queryClient = getQueryClient();
  if (load.kind === "ok") queryClient.setQueryData(accountKeys.order(orderId), load.order);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AccountOrderScreen orderId={orderId} />
    </HydrationBoundary>
  );
}
