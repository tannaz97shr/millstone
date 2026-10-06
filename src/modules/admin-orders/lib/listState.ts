import { adminOrdersContent } from "../content/adminOrdersContent";

/**
 * What A2's list on screen is:
 * - "loading": nothing yet.
 * - "error": nothing to show, and the load failed.
 * - "stale": the rows answer an earlier query, kept up while a new search or
 *   filter loads (or while typing settles). They must not look like the
 *   answer, and can't be acted on.
 * - "current": the rows answer the query on screen. A 30-second refresh of the
 *   same query, in flight or failed, keeps the list current.
 */
export type ListState = "loading" | "error" | "stale" | "current";

export interface ListStateInput {
  hasData: boolean;
  /** TanStack's keepPreviousData: the data belongs to the previous query key. */
  isPlaceholderData: boolean;
  isError: boolean;
  /** Search text typed but not applied yet (the debounce is pending). */
  typing: boolean;
}

export function listState({ hasData, isPlaceholderData, isError, typing }: ListStateInput): ListState {
  if (!hasData) return isError ? "error" : "loading";
  return isPlaceholderData || typing ? "stale" : "current";
}

/** The summary while the list is stale: "Searching…" for a search, else "Loading orders…". */
export function staleSummary(nextQuery: string): string {
  return nextQuery.trim() ? adminOrdersContent.status.searching : adminOrdersContent.load.loading;
}
