import { describe, expect, test } from "bun:test";
import type { OrderId } from "@/shared/domain";
import type { AdminOrderRow } from "../types/adminOrder";
import { withHeldRows } from "./heldRows";

const row = (id: string, status: AdminOrderRow["status"] = "placed") => ({ id: id as OrderId, status }) as AdminOrderRow;

describe("withHeldRows", () => {
  test("nothing held: the list as it is", () => {
    const rows = [row("a")];
    expect(withHeldRows(rows, [null, null], [])).toBe(rows);
  });

  test("a held row still on the list isn't doubled", () => {
    expect(withHeldRows([row("a")], [row("a"), row("a")], [])).toHaveLength(1);
  });

  test("a held row that left the list stays, with the freshest copy", () => {
    const result = withHeldRows([row("a")], [row("b", "placed")], [row("b", "cancelled")]);
    expect(result.map((r) => [r.id, r.status])).toEqual([["a", "placed"], ["b", "cancelled"]]);
  });

  test("without anything fresher, the copy from when it was touched", () => {
    expect(withHeldRows([], [row("b", "ready")], [undefined]).map((r) => r.status)).toEqual(["ready"]);
  });
});
