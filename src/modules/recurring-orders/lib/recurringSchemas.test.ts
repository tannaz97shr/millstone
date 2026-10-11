import { describe, expect, test } from "bun:test";
import {
  createRecurringRequestSchema,
  MAX_RECURRING_ITEMS,
  recurringActionRequestSchema,
  recurringOrderIdParam,
} from "./recurringSchemas";

const valid = {
  branchId: "northcote",
  daysOfWeek: [2, 4, 6],
  items: [{ productId: "plain-bagel", quantity: 12 }],
  startsOn: "2026-10-13",
  endsOn: null,
  notes: "  Back door  ",
};

const errorsOf = (input: unknown) => {
  const result = createRecurringRequestSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe("createRecurringRequestSchema (C11, AC-R2)", () => {
  test("a valid order passes, notes trimmed", () => {
    expect(createRecurringRequestSchema.parse(valid).notes).toBe("Back door");
  });

  test("no days, no items: the designed messages", () => {
    expect(errorsOf({ ...valid, daysOfWeek: [] })).toEqual(["Choose at least one day."]);
    expect(errorsOf({ ...valid, items: [] })).toEqual(["Add at least one item."]);
  });

  test("repeated days or products, bad weekdays, quantities out of range", () => {
    expect(errorsOf({ ...valid, daysOfWeek: [2, 2] })).not.toEqual([]);
    expect(errorsOf({ ...valid, daysOfWeek: [7] })).not.toEqual([]);
    expect(errorsOf({ ...valid, items: [valid.items[0], valid.items[0]] })).not.toEqual([]);
    expect(errorsOf({ ...valid, items: [{ productId: "plain-bagel", quantity: 0 }] })).not.toEqual([]);
    expect(errorsOf({ ...valid, items: [{ productId: "plain-bagel", quantity: 100 }] })).not.toEqual([]);
  });

  test("at most 30 lines", () => {
    const items = Array.from({ length: MAX_RECURRING_ITEMS + 1 }, (_, i) => ({ productId: `p-${i}`, quantity: 1 }));
    expect(errorsOf({ ...valid, items })).toContain("That's more items than one recurring order can hold. Remove a few.");
  });

  test("an end before the start, or a bad date", () => {
    expect(errorsOf({ ...valid, endsOn: "2026-10-12" })).toEqual(["Choose a last pickup day on or after the first."]);
    expect(errorsOf({ ...valid, startsOn: "2026-02-30" })).not.toEqual([]);
  });

  test("prices are never accepted", () => {
    const parsed = createRecurringRequestSchema.parse({ ...valid, items: [{ productId: "plain-bagel", quantity: 1, priceCents: 1 }] });
    expect(parsed.items[0]).toEqual({ productId: "plain-bagel", quantity: 1 });
  });
});

describe("recurringActionRequestSchema (C12)", () => {
  test("each action with what it needs", () => {
    expect(recurringActionRequestSchema.safeParse({ action: "pause", expectedVersion: 0 }).success).toBe(true);
    expect(recurringActionRequestSchema.safeParse({ action: "skip", date: "2026-10-13", expectedVersion: 1 }).success).toBe(true);
    expect(recurringActionRequestSchema.safeParse({ action: "skip", expectedVersion: 1 }).success).toBe(false);
    expect(recurringActionRequestSchema.safeParse({ action: "end_after", date: "2026-10-13" }).success).toBe(false);
    expect(recurringActionRequestSchema.safeParse({ action: "delete", expectedVersion: 1 }).success).toBe(false);
  });
});

describe("recurringOrderIdParam", () => {
  test("Firestore auto IDs and seed IDs; never an underscore (it separates generated order IDs)", () => {
    expect(recurringOrderIdParam.safeParse("Ab3dE5gH7jK9mN1pQ3sT").success).toBe(true);
    expect(recurringOrderIdParam.safeParse("seed-corner-cup").success).toBe(true);
    expect(recurringOrderIdParam.safeParse("a_b").success).toBe(false);
    expect(recurringOrderIdParam.safeParse("../x").success).toBe(false);
  });
});
