import { describe, expect, test } from "bun:test";
import type { BranchSchedule, TimeOfDay, Weekday } from "@/shared/domain";
import {
  availablePickupDates,
  cutoffFor,
  earliestPickupDate,
  formatPickupDay,
  isClosedOn,
  isOrderableDate,
  isSoldOut,
  melbourneDateOf,
  toIsoDate,
} from ".";

// Instants are written in UTC. Melbourne is +10 (AEST) until 02:00 on
// Sun 4 Oct 2026, then +11 (AEDT).

const at = (utc: string) => new Date(utc);
const d = toIsoDate;

const branch = (closedDays: Weekday[] = [1]): BranchSchedule => ({
  orderCutoffTime: "14:00" as TimeOfDay,
  closedDays,
});
const closedMondays = branch([1]);
const openEveryDay = branch([]);

describe("earliestPickupDate around the 2pm cutoff (Wed 30 Sep 2026)", () => {
  test("13:59 → tomorrow", () => {
    expect(earliestPickupDate(closedMondays, at("2026-09-30T03:59:00Z"))).toBe(d("2026-10-01"));
  });

  test("exactly 14:00:00 counts as after the cutoff", () => {
    expect(earliestPickupDate(closedMondays, at("2026-09-30T04:00:00.000Z"))).toBe(
      d("2026-10-02"),
    );
  });

  test("one millisecond before 14:00 is still before the cutoff", () => {
    expect(earliestPickupDate(closedMondays, at("2026-09-30T03:59:59.999Z"))).toBe(
      d("2026-10-01"),
    );
  });

  test("14:01 → the day after tomorrow", () => {
    expect(earliestPickupDate(closedMondays, at("2026-09-30T04:01:00Z"))).toBe(d("2026-10-02"));
  });
});

describe("closed Mondays", () => {
  test("Sunday after the cutoff skips closed Monday → Tuesday", () => {
    // Sun 27 Sep 15:00 Melbourne
    expect(earliestPickupDate(closedMondays, at("2026-09-27T05:00:00Z"))).toBe(d("2026-09-29"));
  });

  test("Sunday before the cutoff → still Tuesday, Monday is closed", () => {
    // Sun 27 Sep 13:00 Melbourne
    expect(earliestPickupDate(closedMondays, at("2026-09-27T03:00:00Z"))).toBe(d("2026-09-29"));
  });

  test("Saturday after the cutoff: Sunday's cutoff passed, Monday closed → Tuesday", () => {
    // Sat 26 Sep 15:00 Melbourne
    expect(earliestPickupDate(closedMondays, at("2026-09-26T05:00:00Z"))).toBe(d("2026-09-29"));
  });

  test("Saturday before the cutoff → Sunday", () => {
    // Sat 26 Sep 13:00 Melbourne
    expect(earliestPickupDate(closedMondays, at("2026-09-26T03:00:00Z"))).toBe(d("2026-09-27"));
  });

  test("Tuesday's cutoff is Monday 2pm even though the shop is closed Monday", () => {
    expect(cutoffFor(closedMondays, d("2026-09-29")).toISOString()).toBe(
      "2026-09-28T04:00:00.000Z",
    );
  });

  test("availablePickupDates skips every Monday", () => {
    // Wed 30 Sep 10:00 Melbourne
    expect(availablePickupDates(closedMondays, at("2026-09-30T00:00:00Z"), 7)).toEqual([
      d("2026-10-01"),
      d("2026-10-02"),
      d("2026-10-03"),
      d("2026-10-04"),
      d("2026-10-06"),
      d("2026-10-07"),
      d("2026-10-08"),
    ]);
  });
});

describe("around Melbourne midnight", () => {
  // Tue 29 Sep 23:59 and Wed 30 Sep 00:01 in Melbourne are both Tue 29 Sep in UTC.
  const justBefore = at("2026-09-29T13:59:00Z");
  const justAfter = at("2026-09-29T14:01:00Z");

  test("the Melbourne date flips at Melbourne midnight, not UTC midnight", () => {
    expect(melbourneDateOf(justBefore)).toBe(d("2026-09-29"));
    expect(melbourneDateOf(justAfter)).toBe(d("2026-09-30"));
  });

  test("23:59 (after Tuesday's cutoff) → Thursday", () => {
    expect(earliestPickupDate(closedMondays, justBefore)).toBe(d("2026-10-01"));
  });

  test("00:01 the next morning (before Wednesday's cutoff) → Thursday", () => {
    expect(earliestPickupDate(closedMondays, justAfter)).toBe(d("2026-10-01"));
  });

  test("midnight never makes today orderable", () => {
    expect(isOrderableDate(openEveryDay, d("2026-09-30"), justAfter)).toBe(false);
  });
});

describe("daylight saving starts Sun 4 Oct 2026 (02:00 AEST → 03:00 AEDT)", () => {
  test("cutoff for Sun 4 Oct is Sat 3 Oct 14:00 AEST", () => {
    expect(cutoffFor(openEveryDay, d("2026-10-04")).toISOString()).toBe(
      "2026-10-03T04:00:00.000Z",
    );
  });

  test("cutoff for Mon 5 Oct is Sun 4 Oct 14:00 AEDT", () => {
    expect(cutoffFor(openEveryDay, d("2026-10-05")).toISOString()).toBe(
      "2026-10-04T03:00:00.000Z",
    );
  });

  test("13:59 AEDT on Sun 4 Oct → Monday; 14:00 AEDT → Tuesday", () => {
    // A fixed +10 offset would read these as 12:59 and 13:00 and get both wrong.
    expect(earliestPickupDate(openEveryDay, at("2026-10-04T02:59:00Z"))).toBe(d("2026-10-05"));
    expect(earliestPickupDate(openEveryDay, at("2026-10-04T03:00:00Z"))).toBe(d("2026-10-06"));
  });

  test("either side of the clock jump is still Sunday", () => {
    expect(melbourneDateOf(at("2026-10-03T15:59:00Z"))).toBe(d("2026-10-04")); // 01:59 AEST
    expect(melbourneDateOf(at("2026-10-03T16:00:00Z"))).toBe(d("2026-10-04")); // 03:00 AEDT
  });

  test("closed-Monday branch on DST Sunday → Tuesday", () => {
    expect(earliestPickupDate(closedMondays, at("2026-10-03T16:00:00Z"))).toBe(d("2026-10-06"));
  });

  test("daylight saving ends Sun 4 Apr 2027: cutoffs move back to +10", () => {
    expect(cutoffFor(openEveryDay, d("2027-04-04")).toISOString()).toBe(
      "2027-04-03T03:00:00.000Z",
    );
    expect(cutoffFor(openEveryDay, d("2027-04-05")).toISOString()).toBe(
      "2027-04-04T04:00:00.000Z",
    );
  });
});

describe("isClosedOn / isOrderableDate", () => {
  test("Mondays are closed, other days open", () => {
    expect(isClosedOn(closedMondays, d("2026-10-05"))).toBe(true);
    expect(isClosedOn(closedMondays, d("2026-10-06"))).toBe(false);
  });

  test("a closed day is never orderable, however early", () => {
    expect(isOrderableDate(closedMondays, d("2026-10-12"), at("2026-09-30T00:00:00Z"))).toBe(
      false,
    );
  });

  test("a branch closed every day throws instead of looping", () => {
    expect(() => earliestPickupDate(branch([0, 1, 2, 3, 4, 5, 6]), at("2026-09-30T00:00:00Z")))
      .toThrow();
  });
});

describe("isSoldOut", () => {
  test("only on the exact date", () => {
    const bp = { soldOutOn: d("2026-10-01") };
    expect(isSoldOut(bp, d("2026-10-01"))).toBe(true);
    expect(isSoldOut(bp, d("2026-10-02"))).toBe(false);
    expect(isSoldOut({ soldOutOn: null }, d("2026-10-01"))).toBe(false);
  });
});

describe("formatPickupDay", () => {
  test("weekday comes from the date", () => {
    expect(formatPickupDay(d("2026-09-30"))).toBe("Wed 30 Sep");
    expect(formatPickupDay(d("2026-10-04"))).toBe("Sun 4 Oct");
    expect(formatPickupDay(d("2027-02-28"))).toBe("Sun 28 Feb");
  });

  test("toIsoDate rejects impossible dates", () => {
    expect(() => toIsoDate("2027-02-29")).toThrow();
    expect(() => toIsoDate("30/09/2026")).toThrow();
  });
});
