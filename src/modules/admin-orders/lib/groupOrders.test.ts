import { describe, expect, test } from "bun:test";
import type { BranchId, IsoDate, IsoInstant, OrderId } from "@/shared/domain";
import type { AdminBranchOption, AdminOrderRow } from "../types/adminOrder";
import { groupOrders, orderNumberValue } from "./groupOrders";

const branches: AdminBranchOption[] = [
  { id: "northcote" as BranchId, name: "Northcote", closedDays: [1] },
  { id: "fitzroy" as BranchId, name: "Fitzroy", closedDays: [1] },
  { id: "brunswick" as BranchId, name: "Brunswick", closedDays: [1] },
];

function row(number: number, date: string, branchId = "northcote", status: AdminOrderRow["status"] = "placed"): AdminOrderRow {
  return {
    id: `o${number}` as OrderId,
    orderNumber: `MS-${number}`,
    branchId: branchId as BranchId,
    branchName: branchId,
    pickupDate: date as IsoDate,
    status,
    paymentMethod: "at_pickup",
    paymentStatus: "unpaid",
    paymentLabel: "unpaid",
    contactName: "Mei Lin",
    contactPhone: "0491570159",
    items: [],
    totalCents: 0,
    recurring: false,
    notes: null,
    generationNote: null,
    createdAt: "2026-10-03T00:00:00.000Z" as IsoInstant,
  };
}

const numbers = (rows: AdminOrderRow[]) => rows.map((r) => r.orderNumber);

describe("groupOrders", () => {
  test("dates earliest first, numbers in order within a date", () => {
    const groups = groupOrders(
      [row(1046, "2026-10-06"), row(1043, "2026-10-04"), row(1038, "2026-10-04", "northcote", "ready")],
      branches,
      false,
    );
    expect(groups.map((g) => g.date)).toEqual(["2026-10-04", "2026-10-06"] as IsoDate[]);
    expect(numbers(groups[0].sections[0].rows)).toEqual(["MS-1038", "MS-1043"]);
    expect(groups[0]).toMatchObject({ count: 2, readyCount: 1 });
    expect(groups[0].sections[0].branch).toBeNull();
  });

  test("split by branch in the branches' order, only branches with orders", () => {
    const groups = groupOrders(
      [row(1041, "2026-10-04", "brunswick"), row(1039, "2026-10-04", "fitzroy"), row(1043, "2026-10-04")],
      branches,
      true,
    );
    expect(groups[0].sections.map((s) => s.branch?.name)).toEqual(["Northcote", "Fitzroy", "Brunswick"]);
  });

  test("a new order lands at the end of its group, leaving the others where they were", () => {
    const before = groupOrders([row(1043, "2026-10-04"), row(1044, "2026-10-04")], branches, false);
    const after = groupOrders([row(1047, "2026-10-04"), row(1043, "2026-10-04"), row(1044, "2026-10-04")], branches, false);
    expect(numbers(after[0].sections[0].rows)).toEqual([...numbers(before[0].sections[0].rows), "MS-1047"]);
  });

  test("order numbers compare as numbers", () => {
    expect(orderNumberValue("MS-10001")).toBeGreaterThan(orderNumberValue("MS-9999"));
    const groups = groupOrders([row(10001, "2026-10-04"), row(9999, "2026-10-04")], branches, false);
    expect(numbers(groups[0].sections[0].rows)).toEqual(["MS-9999", "MS-10001"]);
  });
});
