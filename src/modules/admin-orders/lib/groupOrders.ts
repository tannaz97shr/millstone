import type { BranchId, IsoDate } from "@/shared/domain";
import type { AdminBranchOption, AdminOrderRow } from "../types/adminOrder";

// A2's grouping (AC-A2): by pickup date, earliest first; for the owner on
// All branches, each date split under branch headings. Within a group, rows
// go by order number, which only grows, so a refresh never moves a row that
// was already there: a new order always lands at the end of its group.

export interface OrderSection {
  /** Null when the date isn't split by branch. */
  branch: AdminBranchOption | null;
  rows: AdminOrderRow[];
}

export interface OrderGroup {
  date: IsoDate;
  count: number;
  readyCount: number;
  sections: OrderSection[];
}

/** "MS-1042" → 1042; anything unreadable sorts last. */
export function orderNumberValue(orderNumber: string): number {
  const digits = orderNumber.replace(/\D/g, "");
  return digits ? Number(digits) : Number.MAX_SAFE_INTEGER;
}

export function compareRows(branchRank: (id: BranchId) => number) {
  return (a: AdminOrderRow, b: AdminOrderRow): number =>
    a.pickupDate.localeCompare(b.pickupDate) ||
    branchRank(a.branchId) - branchRank(b.branchId) ||
    orderNumberValue(a.orderNumber) - orderNumberValue(b.orderNumber) ||
    a.id.localeCompare(b.id);
}

export function groupOrders(
  rows: readonly AdminOrderRow[],
  branches: readonly AdminBranchOption[],
  splitByBranch: boolean,
): OrderGroup[] {
  const rank = new Map(branches.map((branch, index) => [branch.id, index]));
  const branchRank = (id: BranchId) => rank.get(id) ?? branches.length;
  const sorted = [...rows].sort(compareRows(branchRank));

  const groups: OrderGroup[] = [];
  for (const row of sorted) {
    let group = groups.at(-1);
    if (!group || group.date !== row.pickupDate) {
      group = { date: row.pickupDate, count: 0, readyCount: 0, sections: [] };
      groups.push(group);
    }
    group.count += 1;
    if (row.status === "ready") group.readyCount += 1;

    const branch = splitByBranch
      ? (branches.find((b) => b.id === row.branchId) ?? { id: row.branchId, name: row.branchName, closedDays: [] })
      : null;
    let section = group.sections.at(-1);
    if (!section || section.branch?.id !== branch?.id) {
      section = { branch, rows: [] };
      group.sections.push(section);
    }
    section.rows.push(row);
  }
  return groups;
}
