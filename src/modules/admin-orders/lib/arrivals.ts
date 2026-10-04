import type { AdminOrderRow } from "../types/adminOrder";

// "MS-1047 just came in" (A2): orders a refresh brings that this screen
// hasn't seen under the same filters and that were placed since the last
// refresh. An order that comes back after Undo, or one that moves into the
// filter because someone marked it ready, was placed earlier and doesn't count.

/** Covers an order committed a moment after the previous list was read. */
export const ARRIVAL_SLACK_MS = 60_000;

export function findArrivals(
  rows: readonly AdminOrderRow[],
  seen: ReadonlySet<string>,
  previousGeneratedAt: string,
): AdminOrderRow[] {
  const since = Date.parse(previousGeneratedAt) - ARRIVAL_SLACK_MS;
  return rows.filter((row) => !seen.has(row.id) && Date.parse(row.createdAt) > since);
}
