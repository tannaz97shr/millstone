import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountScreen } from "@/modules/account/components/AccountScreen";
import { accountContent } from "@/modules/account/content/accountContent";
import { prefetchAccountOrders } from "@/modules/account/lib/prefetchAccountOrders";
import { getOptionalCustomer } from "@/modules/auth/lib/requireSession";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";
import { routes } from "@/shared/routes";

export const metadata: Metadata = { title: accountContent.myAccount.metadataTitle };

// C9. proxy.ts sends anyone who isn't a signed-in customer to C8 first; this
// catches an account gone since. The data itself is guarded by the API.
export default async function MyAccountPage() {
  const customer = await getOptionalCustomer();
  if (!customer) redirect(routes.account.signIn(routes.account.home));

  const queryClient = getQueryClient();
  await prefetchAccountOrders(queryClient, customer.id);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AccountScreen />
    </HydrationBoundary>
  );
}
