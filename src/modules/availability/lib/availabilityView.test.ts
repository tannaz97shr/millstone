import { describe, expect, test } from "bun:test";
import type { TimeOfDay } from "@/shared/domain";
import { toIsoDate } from "@/shared/utils/pickup-dates";
import type { AvailabilityCalendar } from "../types/availability";
import { availabilityViewFromUrl, availabilityViewToQuery, soldOutDateFor } from "./availabilityView";

const d = toIsoDate;

describe("availability view in the URL", () => {
  test("reads a branch and a date, from URLSearchParams or page params", () => {
    expect(availabilityViewFromUrl(new URLSearchParams("branch=fitzroy&date=2026-10-07"))).toEqual({
      branch: "fitzroy",
      date: "2026-10-07",
    } as never);
    expect(availabilityViewFromUrl({ branch: ["brunswick", "x"], date: undefined })).toEqual({
      branch: "brunswick",
      date: null,
    } as never);
  });

  test("anything unreadable is the default", () => {
    expect(availabilityViewFromUrl(new URLSearchParams("branch=Not A Slug&date=7 Oct"))).toEqual({
      branch: null,
      date: null,
    });
  });

  test("defaults are left out of the query", () => {
    expect(availabilityViewToQuery({ branch: null, date: null })).toEqual({});
    expect(availabilityViewToQuery(availabilityViewFromUrl(new URLSearchParams("branch=fitzroy")))).toEqual({
      branch: "fitzroy",
    });
  });
});

describe("soldOutDateFor", () => {
  const calendar: AvailabilityCalendar = {
    today: d("2026-10-05"),
    earliest: d("2026-10-06"),
    days: 7,
    orderableDates: [d("2026-10-06"), d("2026-10-07"), d("2026-10-08")],
    closedWeekdays: [1],
    cutoffTime: "14:00" as TimeOfDay,
    pastTodaysCutoff: false,
  };

  test("a day the picker can mark is kept", () => {
    expect(soldOutDateFor(d("2026-10-08"), calendar)).toBe(d("2026-10-08"));
  });

  test("none, a passed day or a closed day falls back to the earliest", () => {
    expect(soldOutDateFor(null, calendar)).toBe(d("2026-10-06"));
    expect(soldOutDateFor(d("2026-10-05"), calendar)).toBe(d("2026-10-06"));
    expect(soldOutDateFor(d("2026-10-12"), calendar)).toBe(d("2026-10-06"));
  });
});
