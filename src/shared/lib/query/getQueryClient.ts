import { isServer, QueryCache, QueryClient } from "@tanstack/react-query";
import { shouldRetry } from "@/shared/lib/http/apiClient";
import { logError } from "@/shared/utils/logError";

// TanStack Query's Next.js App Router setup: a fresh client per server
// request (for prefetching), one shared client in the browser.

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Long enough that hydrated server data isn't refetched straight away;
        // short enough, with refetch on focus, that a passed cutoff shows up.
        staleTime: 60_000,
        refetchOnWindowFocus: true,
        // A failed server prefetch isn't retried: the browser asks again
        // anyway, so retrying here would only hold up the page.
        retry: isServer ? false : shouldRetry,
      },
    },
    // Every failed query is logged once, here. Screens show the error state.
    queryCache: new QueryCache({
      onError: (error, query) => {
        logError(error, `query ${JSON.stringify(query.queryKey)}`, {
          level: isServer ? "warn" : "error",
        });
      },
    }),
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
