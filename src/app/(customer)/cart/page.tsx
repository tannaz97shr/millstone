import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { connection } from "next/server";
import { prefetchBranches } from "@/modules/branches/lib/prefetchBranches";
import { CartScreen } from "@/modules/cart/components/CartScreen";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";

// C4. Rendered per request: pickup dates depend on the time of day. The cart
// is only in the browser, so its menu (the prices) is fetched there.
export default async function CartPage() {
  await connection();
  const queryClient = getQueryClient();
  await prefetchBranches(queryClient, new Date());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CartScreen />
    </HydrationBoundary>
  );
}
