import { describe, expect, test } from "bun:test";
import type { IsoInstant, OrderId } from "@/shared/domain";
import type { AdminOrderRow } from "../types/adminOrder";
import { findArrivals } from "./arrivals";

const row = (id: string, createdAt: string) => ({ id: id as OrderId, createdAt: createdAt as IsoInstant }) as AdminOrderRow;

describe("findArrivals", () => {
  const previous = "2026-10-04T22:00:00.000Z";

  test("a new order placed since the last refresh", () => {
    const rows = [row("a", "2026-10-04T20:00:00.000Z"), row("b", "2026-10-04T22:00:20.000Z")];
    expect(findArrivals(rows, new Set(["a"]), previous).map((r) => r.id)).toEqual(["b"] as OrderId[]);
  });

  test("one committed just before the last refresh read still counts", () => {
    expect(findArrivals([row("b", "2026-10-04T21:59:30.000Z")], new Set(), previous)).toHaveLength(1);
  });

  test("an old order newly in the filter (marked ready elsewhere, or back after Undo) doesn't", () => {
    expect(findArrivals([row("c", "2026-10-03T09:00:00.000Z")], new Set(), previous)).toEqual([]);
  });

  test("nothing seen twice", () => {
    expect(findArrivals([row("b", "2026-10-04T22:00:20.000Z")], new Set(["b"]), previous)).toEqual([]);
  });
});
