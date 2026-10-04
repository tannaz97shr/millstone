import type { AdminOrderRow } from "../types/adminOrder";

/**
 * The rows to show: the list, plus any held row that has left it, with the
 * freshest copy there is (the list, else the order's own detail, else the
 * copy from when it was touched). Grouping then puts it back in its slot.
 */
export function withHeldRows(
  rows: readonly AdminOrderRow[],
  held: readonly (AdminOrderRow | null)[],
  fresher: readonly (AdminOrderRow | undefined)[],
): readonly AdminOrderRow[] {
  const shown = new Set(rows.map((row) => row.id));
  const latest = new Map(fresher.flatMap((row) => (row ? [[row.id, row] as const] : [])));
  const extra: AdminOrderRow[] = [];
  for (const row of held) {
    if (!row || shown.has(row.id) || extra.some((other) => other.id === row.id)) continue;
    extra.push(latest.get(row.id) ?? row);
  }
  return extra.length > 0 ? [...rows, ...extra] : rows;
}
