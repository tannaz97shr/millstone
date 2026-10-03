import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { branchIdParam, pickupDateParam } from "@/modules/branches/lib/branchParams";
import { prefetchBranches } from "@/modules/branches/lib/prefetchBranches";
import { resolvePickupDate } from "@/modules/cart/lib/cartLogic";
import { MenuScreen } from "@/modules/menu/components/MenuScreen";
import { prefetchMenu } from "@/modules/menu/lib/prefetchMenu";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";

export interface MenuPageProps {
  params: Promise<{ branchId: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
}

// C2. Rendered per request: the pickup dates depend on the time of day.
// The server can't see the cart, so it prefetches the URL's date (or the
// earliest); the browser moves to the cart's date if the URL had none.
export default async function MenuPage({ params, searchParams }: MenuPageProps) {
  await connection();
  const branchId = branchIdParam.safeParse((await params).branchId);
  if (!branchId.success) notFound();

  const queryClient = getQueryClient();
  const now = new Date();
  const branches = await prefetchBranches(queryClient, now);
  const branch = branches?.branches.find((b) => b.id === branchId.data);
  if (branches && !branch) notFound();

  if (branch) {
    const urlDate = pickupDateParam.safeParse((await searchParams).date);
    const { date } = resolvePickupDate(urlDate.success ? urlDate.data : null, null, branch.pickup);
    await prefetchMenu(queryClient, branch.id, date, now);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MenuScreen branchId={branchId.data} />
    </HydrationBoundary>
  );
}
