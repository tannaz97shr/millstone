import { describe, expect, test } from "bun:test";
import type { BranchSchedule, TimeOfDay } from "@/shared/domain";
import { isPastTodaysCutoff, pickupCalendar, pickupDateProblem, toIsoDate } from ".";

// Instants are written in UTC. Melbourne is +10 (AEST) until 02:00 on
// Sun 4 Oct 2026, then +11 (AEDT).

const at = (utc: string) => new Date(utc);
const d = toIsoDate;

const closedMondays: BranchSchedule = {
  orderCutoffTime: "14:00" as TimeOfDay,
  closedDays: [1],
};

describe("isPastTodaysCutoff", () => {
  test("13:59 Wed is before, 14:00 is past", () => {
    expect(isPastTodaysCutoff(closedMondays, at("2026-09-30T03:59:00Z"))).toBe(false);
    expect(isPastTodaysCutoff(closedMondays, at("2026-09-30T04:00:00Z"))).toBe(true);
  });

  test("resets at Melbourne midnight, not UTC midnight", () => {
    // 00:30 Thu 1 Oct in Melbourne is still Wed 30 Sep in UTC.
    expect(isPastTodaysCutoff(closedMondays, at("2026-09-30T14:30:00Z"))).toBe(false);
    // 23:59 Wed in Melbourne.
    expect(isPastTodaysCutoff(closedMondays, at("2026-09-30T13:59:00Z"))).toBe(true);
  });

  test("on the day daylight saving starts the cutoff is 14:00 AEDT", () => {
    expect(isPastTodaysCutoff(closedMondays, at("2026-10-04T02:59:00Z"))).toBe(false);
    expect(isPastTodaysCutoff(closedMondays, at("2026-10-04T03:00:00Z"))).toBe(true);
  });
});

describe("pickupCalendar", () => {
  test("before the cutoff: the strip starts tomorrow and skips Mondays", () => {
    const calendar = pickupCalendar(closedMondays, at("2026-09-30T03:59:00Z"));
    expect(calendar.earliest).toBe(d("2026-10-01"));
    expect(calendar.stripStart).toBe(d("2026-10-01"));
    expect(calendar.stripDays).toBe(14);
    expect(calendar.pastTodaysCutoff).toBe(false);
    // 1–14 Oct has two Mondays (5th and 12th).
    expect(calendar.orderableDates).toHaveLength(12);
    expect(calendar.orderableDates).not.toContain(d("2026-10-05"));
    expect(calendar.orderableDates).not.toContain(d("2026-10-12"));
    expect(calendar.orderableDates[0]).toBe(d("2026-10-01"));
    expect(calendar.orderableDates.at(-1)).toBe(d("2026-10-14"));
  });

  test("after the cutoff: tomorrow stays on the strip but can't be ordered", () => {
    const calendar = pickupCalendar(closedMondays, at("2026-09-30T04:00:00Z"));
    expect(calendar.earliest).toBe(d("2026-10-02"));
    expect(calendar.stripStart).toBe(d("2026-10-01"));
    expect(calendar.pastTodaysCutoff).toBe(true);
    expect(calendar.orderableDates).not.toContain(d("2026-10-01"));
    expect(calendar.orderableDates[0]).toBe(d("2026-10-02"));
  });

  test("Saturday after the cutoff: Sunday is past, Monday closed, Tuesday is first", () => {
    const calendar = pickupCalendar(closedMondays, at("2026-10-03T05:00:00Z"));
    expect(calendar.stripStart).toBe(d("2026-10-04"));
    expect(calendar.earliest).toBe(d("2026-10-06"));
    expect(calendar.pastTodaysCutoff).toBe(true);
  });

  test("the strip starts on tomorrow in Melbourne, not in UTC", () => {
    // 00:30 Thu 1 Oct in Melbourne (still Wed in UTC): tomorrow is Fri 2 Oct.
    const calendar = pickupCalendar(closedMondays, at("2026-09-30T14:30:00Z"));
    expect(calendar.stripStart).toBe(d("2026-10-02"));
    expect(calendar.earliest).toBe(d("2026-10-02"));
  });

  test("Sunday before the cutoff: Monday is closed, so Tuesday is first and the note stays normal", () => {
    const calendar = pickupCalendar(closedMondays, at("2026-10-04T01:00:00Z"));
    expect(calendar.earliest).toBe(d("2026-10-06"));
    expect(calendar.pastTodaysCutoff).toBe(false);
  });

  test("strip length can be changed", () => {
    const calendar = pickupCalendar(closedMondays, at("2026-09-30T03:59:00Z"), 3);
    expect(calendar.orderableDates).toEqual([d("2026-10-01"), d("2026-10-02"), d("2026-10-03")]);
  });
});

describe("pickupDateProblem", () => {
  const calendar = pickupCalendar(closedMondays, at("2026-09-30T04:00:00Z"));

  test("an orderable date has no problem", () => {
    expect(pickupDateProblem(calendar, d("2026-10-02"))).toBeNull();
  });

  test("before the earliest date is past the cutoff", () => {
    expect(pickupDateProblem(calendar, d("2026-10-01"))).toBe("past_cutoff");
    expect(pickupDateProblem(calendar, d("2026-09-01"))).toBe("past_cutoff");
  });

  test("a Monday inside the strip is a closed day", () => {
    expect(pickupDateProblem(calendar, d("2026-10-05"))).toBe("closed_day");
  });

  test("after the last tile is out of range", () => {
    // Strip is 1–14 Oct.
    expect(pickupDateProblem(calendar, d("2026-10-14"))).toBeNull();
    expect(pickupDateProblem(calendar, d("2026-10-15"))).toBe("out_of_range");
  });
});
