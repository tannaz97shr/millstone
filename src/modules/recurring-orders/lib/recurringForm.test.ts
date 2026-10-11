import { describe, expect, test } from "bun:test";
import type { IsoDate } from "@/shared/domain";
import type { RecurringOrderDetail } from "../types/recurringOrderView";
import {
  blankFormValues,
  chosenItems,
  formSummary,
  formValuesFromDetail,
  keepListed,
  recurringFormSchema,
  toCreateRequest,
  toUpdateRequest,
  type RecurringFormValues,
} from "./recurringForm";
import { createRecurringRequestSchema, updateRecurringRequestSchema } from "./recurringSchemas";

const d = (value: string) => value as IsoDate;
const ORDER = ["sourdough-rye-loaf", "almond-croissant", "plain-bagel"];

function filled(over: Partial<RecurringFormValues> = {}): RecurringFormValues {
  return {
    branchId: "northcote",
    daysOfWeek: [6, 2],
    quantities: { "plain-bagel": 12, "almond-croissant": 0, "sourdough-rye-loaf": 4 },
    startsOn: d("2026-10-13"),
    hasEnd: false,
    endsOn: null,
    notes: "  Back door, before 7am  ",
    ...over,
  };
}

const errorsOf = (values: RecurringFormValues) => {
  const parsed = recurringFormSchema.safeParse(values);
  return parsed.success ? {} : Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message]));
};

describe("recurringFormSchema", () => {
  test("a blank form gives the designed errors (RecFormErrors)", () => {
    expect(errorsOf(blankFormValues(d("2026-10-13")))).toEqual({
      branchId: "Choose a branch.",
      daysOfWeek: "Choose at least one day.",
      quantities: "Add at least one item.",
    });
  });

  test("quantities that are all 0 count as no items", () => {
    expect(errorsOf(filled({ quantities: { "plain-bagel": 0 } }))).toEqual({ quantities: "Add at least one item." });
  });

  test("an end date switched on needs a day, on or after the start", () => {
    expect(errorsOf(filled({ hasEnd: true, endsOn: null }))).toEqual({ endsOn: "Choose the last pickup day." });
    expect(errorsOf(filled({ hasEnd: true, endsOn: d("2026-10-10") }))).toEqual({
      endsOn: "Choose a last pickup day on or after the first.",
    });
    expect(errorsOf(filled({ hasEnd: true, endsOn: d("2026-10-17") }))).toEqual({});
  });

  test("an end date left over while switched off doesn't count", () => {
    expect(errorsOf(filled({ hasEnd: false, endsOn: d("2026-10-01") }))).toEqual({});
  });
});

describe("requests", () => {
  test("create: sorted days, chosen lines in list order, trimmed notes, and the API accepts it", () => {
    const request = toCreateRequest(recurringFormSchema.parse(filled()), ORDER);
    expect(request).toEqual({
      branchId: "northcote",
      daysOfWeek: [2, 6],
      items: [
        { productId: "sourdough-rye-loaf", quantity: 4 },
        { productId: "plain-bagel", quantity: 12 },
      ],
      startsOn: "2026-10-13",
      endsOn: null,
      notes: "Back door, before 7am",
    });
    expect(createRecurringRequestSchema.safeParse(request).success).toBe(true);
  });

  test("edit: the version it read, the end only while switched on", () => {
    const request = toUpdateRequest(recurringFormSchema.parse(filled({ hasEnd: false, endsOn: d("2026-10-31") })), ORDER, 3);
    expect(request.endsOn).toBeNull();
    expect(request.expectedVersion).toBe(3);
    expect(updateRecurringRequestSchema.safeParse(request).success).toBe(true);
  });

  test("a product not in the list isn't sent", () => {
    expect(chosenItems({ "plain-bagel": 2, "everything-bagel": 3 }, ["plain-bagel"])).toEqual([
      { productId: "plain-bagel", quantity: 2 },
    ]);
  });
});

test("keepListed drops what the branch doesn't make", () => {
  expect(keepListed({ "plain-bagel": 2, "fruit-loaf": 1 }, new Set(["plain-bagel"]))).toEqual({ "plain-bagel": 2 });
});

describe("formSummary", () => {
  test("items, days and branch, as in the footer", () => {
    expect(formSummary(filled(), ORDER, "Northcote")).toBe("16 items · Tue and Sat · Northcote");
    expect(formSummary({ daysOfWeek: [], quantities: { "plain-bagel": 1 } }, ORDER, null)).toBe("1 item · no days chosen");
  });

  test("only listed products count", () => {
    expect(formSummary({ daysOfWeek: [2], quantities: { "fruit-loaf": 5 } }, ORDER, "Fitzroy")).toBe(
      "0 items · Tue · Fitzroy",
    );
  });
});

test("formValuesFromDetail keeps the order's items, end and notes", () => {
  const detail = {
    branch: { id: "fitzroy" },
    daysOfWeek: [6],
    items: [{ productId: "seeded-sandwich-loaf", quantity: 2, name: "Seeded sandwich loaf", onMenu: false, priceCents: null }],
    startsOn: d("2026-08-15"),
    endsOn: d("2026-12-19"),
    notes: "",
  } as unknown as RecurringOrderDetail;
  expect(formValuesFromDetail(detail)).toEqual({
    branchId: "fitzroy",
    daysOfWeek: [6],
    quantities: { "seeded-sandwich-loaf": 2 },
    startsOn: d("2026-08-15"),
    hasEnd: true,
    endsOn: d("2026-12-19"),
    notes: "",
  });
});
