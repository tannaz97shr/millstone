import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { connection } from "next/server";
import { prefetchBranches } from "@/modules/branches/lib/prefetchBranches";
import { HomeScreen } from "@/modules/home/components/HomeScreen";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";

// C1. Rendered per request: pickup dates depend on the time of day.
export default async function HomePage() {
  await connection();
  const queryClient = getQueryClient();
  await prefetchBranches(queryClient, new Date());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeScreen />
    </HydrationBoundary>
  );
}
