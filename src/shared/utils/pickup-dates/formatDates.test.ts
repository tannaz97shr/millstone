import { describe, expect, test } from "bun:test";
import type { Weekday } from "@/shared/domain";
import {
  addDays,
  addMonths,
  dayOfMonth,
  daysInMonth,
  formatLongDay,
  formatMonthTitle,
  formatPickupDay,
  formatTimeOfDay,
  formatWeekdayList,
  monthShortName,
  startOfMonth,
  toIsoDate,
  toTimeOfDay,
  weekdayName,
  weekdayOf,
} from ".";

const d = toIsoDate;

describe("weekdayName", () => {
  test("0 is Sunday, 6 is Saturday", () => {
    expect(weekdayName(0)).toBe("Sun");
    expect(weekdayName(1, "long")).toBe("Monday");
    expect(weekdayName(6, "long")).toBe("Saturday");
  });

  test("agrees with formatPickupDay for every weekday", () => {
    // 27 Sep 2026 is a Sunday; walk one week, across the month end.
    for (let i = 0; i < 7; i++) {
      const date = addDays(d("2026-09-27"), i);
      expect(weekdayOf(date)).toBe(i as Weekday);
      expect(formatPickupDay(date).startsWith(`${weekdayName(i as Weekday)} `)).toBe(true);
    }
  });
});

describe("formatting", () => {
  test("long day carries the weekday from the date", () => {
    expect(formatLongDay(d("2026-09-30"))).toBe("Wednesday 30 September");
    expect(formatLongDay(d("2026-10-04"))).toBe("Sunday 4 October");
  });

  test("month title and short month", () => {
    expect(formatMonthTitle(d("2026-09-30"))).toBe("September 2026");
    expect(formatMonthTitle(d("2027-01-01"))).toBe("January 2027");
    expect(monthShortName(d("2026-09-30"))).toBe("Sep");
  });
});

describe("formatTimeOfDay", () => {
  const t = (value: string) => toTimeOfDay(value);

  test("whole hours drop the minutes", () => {
    expect(formatTimeOfDay(t("14:00"))).toBe("2pm");
    expect(formatTimeOfDay(t("07:00"))).toBe("7am");
  });

  test("minutes are kept with two digits", () => {
    expect(formatTimeOfDay(t("07:30"))).toBe("7:30am");
    expect(formatTimeOfDay(t("13:05"))).toBe("1:05pm");
  });

  test("noon and midnight", () => {
    expect(formatTimeOfDay(t("12:00"))).toBe("12pm");
    expect(formatTimeOfDay(t("00:00"))).toBe("12am");
    expect(formatTimeOfDay(t("23:59"))).toBe("11:59pm");
  });
});

describe("formatWeekdayList", () => {
  test("one day is plural", () => {
    expect(formatWeekdayList([1])).toBe("Mondays");
  });

  test("several days in week order, without duplicates", () => {
    expect(formatWeekdayList([2, 0, 1, 2])).toBe("Sundays, Mondays and Tuesdays");
  });

  test("no closed days is an empty string", () => {
    expect(formatWeekdayList([])).toBe("");
  });
});

describe("month arithmetic", () => {
  test("startOfMonth and dayOfMonth", () => {
    expect(startOfMonth(d("2026-09-30"))).toBe(d("2026-09-01"));
    expect(dayOfMonth(d("2026-09-07"))).toBe(7);
  });

  test("daysInMonth: leap and non-leap February, 30 and 31 day months", () => {
    expect(daysInMonth(d("2028-02-10"))).toBe(29);
    expect(daysInMonth(d("2026-02-10"))).toBe(28);
    expect(daysInMonth(d("2026-09-01"))).toBe(30);
    expect(daysInMonth(d("2026-10-01"))).toBe(31);
  });

  test("October 2026 (daylight saving starts on the 4th) still has 31 calendar days", () => {
    expect(daysInMonth(d("2026-10-04"))).toBe(31);
    expect(addMonths(d("2026-09-04"), 1)).toBe(d("2026-10-04"));
  });

  test("addMonths clamps to the last day and crosses years", () => {
    expect(addMonths(d("2026-01-31"), 1)).toBe(d("2026-02-28"));
    expect(addMonths(d("2028-01-31"), 1)).toBe(d("2028-02-29"));
    expect(addMonths(d("2026-12-15"), 1)).toBe(d("2027-01-15"));
    expect(addMonths(d("2026-01-15"), -1)).toBe(d("2025-12-15"));
    expect(addMonths(d("2026-03-31"), -1)).toBe(d("2026-02-28"));
  });
});
