import { describe, expect, test } from "bun:test";
import { adminOrderFiltersSchema, DEFAULT_FILTERS, filterInput, filtersFromUrl, filtersToQuery } from "./orderFilters";

describe("filtersFromUrl", () => {
  test("no params is the default list", () => {
    expect(filtersFromUrl(new URLSearchParams())).toEqual(DEFAULT_FILTERS);
  });

  test("reads every filter", () => {
    expect(
      filtersFromUrl(new URLSearchParams("status=cancelled&date=2026-10-06&branch=fitzroy&q=%20MS-1042%20")),
    ).toEqual({ status: "cancelled", date: "2026-10-06", branch: "fitzroy", q: "MS-1042" } as never);
  });

  test("unreadable values fall back one by one", () => {
    expect(filtersFromUrl({ status: "lost", date: "2026-13-40", branch: "Not A Slug", q: "" })).toEqual(DEFAULT_FILTERS);
    expect(filtersFromUrl({ status: "ready", date: "nope" }).status).toBe("ready");
  });
});

describe("the API schema is strict", () => {
  test("unknown values are refused", () => {
    expect(adminOrderFiltersSchema.safeParse(filterInput(new URLSearchParams("status=lost"))).success).toBe(false);
    expect(adminOrderFiltersSchema.safeParse(filterInput(new URLSearchParams("date=yesterday"))).success).toBe(false);
  });

  test("presets and dates are accepted", () => {
    for (const date of ["all", "today", "tomorrow", "2026-10-06"]) {
      expect(adminOrderFiltersSchema.safeParse({ date }).success).toBe(true);
    }
  });
});

describe("filtersToQuery", () => {
  test("defaults stay out of the URL and round-trip", () => {
    expect(filtersToQuery(DEFAULT_FILTERS)).toEqual({});
    const query = filtersToQuery({ status: "ready", date: "today", branch: null, q: " sam " });
    expect(query).toEqual({ status: "ready", date: "today", q: "sam" });
    expect(filtersFromUrl(new URLSearchParams(query))).toEqual({ status: "ready", date: "today", branch: null, q: "sam" });
  });
});
