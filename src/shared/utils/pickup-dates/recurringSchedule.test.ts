import { describe, expect, test } from "bun:test";
import type { BranchSchedule, IsoDate, TimeOfDay, Weekday } from "@/shared/domain";
import {
  displayStatus,
  dueDates,
  endDateOptions,
  firstChangeableDate,
  firstPickupFrom,
  isScheduledOn,
  lockedThrough,
  nextPickup,
  stopNowEndsOn,
  toIsoDate,
  upcomingPickups,
  wouldGenerate,
  type RecurringSchedule,
} from ".";

// Instants are written in UTC. Melbourne is +10 (AEST) until 02:00 on
// Sun 4 Oct 2026, then +11 (AEDT) until 03:00 on Sun 4 Apr 2027.

const at = (utc: string) => new Date(utc);
const d = toIsoDate;

const branch = (closedDays: Weekday[] = [1], cutoff = "14:00"): BranchSchedule => ({
  orderCutoffTime: cutoff as TimeOfDay,
  closedDays,
});
const closedMondays = branch([1]);
const openEveryDay = branch([]);

const schedule = (overrides: Partial<RecurringSchedule> = {}): RecurringSchedule => ({
  daysOfWeek: [2, 4, 6], // Tue, Thu, Sat
  status: "active",
  startsOn: d("2026-09-01"),
  endsOn: null,
  skipDates: [],
  generatedThrough: null,
  ...overrides,
});

const noOrders = new Map<IsoDate, string>();

describe("lockedThrough: the last date whose cutoff has passed", () => {
  test("before 2pm only today is locked (Wed 30 Sep 2026, 1:59pm AEST)", () => {
    expect(lockedThrough(closedMondays, at("2026-09-30T03:59:59.999Z"))).toBe(d("2026-09-30"));
  });

  test("from 2pm exactly, tomorrow is locked too", () => {
    expect(lockedThrough(closedMondays, at("2026-09-30T04:00:00.000Z"))).toBe(d("2026-10-01"));
  });

  test("a closed tomorrow is still locked after the cutoff (Sun 4 Oct → Mon 5 Oct)", () => {
    expect(lockedThrough(closedMondays, at("2026-10-04T03:30:00Z"))).toBe(d("2026-10-05"));
  });

  test("a later branch cutoff moves the lock later", () => {
    const late = branch([1], "17:00");
    expect(lockedThrough(late, at("2026-09-30T06:59:00Z"))).toBe(d("2026-09-30"));
    expect(lockedThrough(late, at("2026-09-30T07:00:00Z"))).toBe(d("2026-10-01"));
  });

  test("just after Melbourne midnight, the new today is locked and tomorrow isn't", () => {
    // 00:30 AEDT Sun 1 Nov 2026.
    expect(lockedThrough(closedMondays, at("2026-10-31T13:30:00Z"))).toBe(d("2026-11-01"));
  });

  test("firstChangeableDate is the day after", () => {
    expect(firstChangeableDate(closedMondays, at("2026-09-30T04:00:00Z"))).toBe(d("2026-10-02"));
  });
});

describe("the daily cron at 04:00 UTC, run any time in that hour (Vercel Hobby)", () => {
  const cases: [string, string, string][] = [
    // [instant, Melbourne wall time, expected lockedThrough]
    ["2026-10-03T04:00:00Z", "Sat 3 Oct 2pm AEST, the day before DST starts", "2026-10-04"],
    ["2026-10-03T04:59:59Z", "Sat 3 Oct 2:59pm AEST", "2026-10-04"],
    ["2026-10-04T04:00:00Z", "Sun 4 Oct 3pm AEDT, DST's first day", "2026-10-05"],
    ["2026-10-04T04:59:59Z", "Sun 4 Oct 3:59pm AEDT", "2026-10-05"],
    ["2027-04-03T04:00:00Z", "Sat 3 Apr 3pm AEDT, the day before DST ends", "2027-04-04"],
    ["2027-04-04T04:00:00Z", "Sun 4 Apr 2pm AEST, DST's end", "2027-04-05"],
    ["2027-04-04T04:59:59Z", "Sun 4 Apr 2:59pm AEST", "2027-04-05"],
  ];
  for (const [instant, label, expected] of cases) {
    test(`${label} → tomorrow is locked`, () => {
      expect(lockedThrough(closedMondays, at(instant))).toBe(d(expected));
    });
  }

  test("an hour earlier (03:30 UTC) is before the cutoff in winter (1:30pm AEST)…", () => {
    expect(lockedThrough(closedMondays, at("2026-09-30T03:30:00Z"))).toBe(d("2026-09-30"));
  });

  test("…but after it in summer (2:30pm AEDT), which is why the cron runs at 04:00", () => {
    expect(lockedThrough(closedMondays, at("2026-10-10T03:30:00Z"))).toBe(d("2026-10-11"));
  });
});

describe("month and year edges", () => {
  const cases: [string, string, string][] = [
    ["2026-10-31T04:30:00Z", "Sat 31 Oct → Sun 1 Nov", "2026-11-01"],
    ["2027-02-28T04:30:00Z", "Sun 28 Feb 2027 → Mon 1 Mar", "2027-03-01"],
    ["2028-02-28T04:30:00Z", "Mon 28 Feb 2028 → Tue 29 Feb (leap year)", "2028-02-29"],
    ["2028-02-29T04:30:00Z", "Tue 29 Feb 2028 → Wed 1 Mar", "2028-03-01"],
    ["2026-12-31T04:30:00Z", "Thu 31 Dec 2026 → Fri 1 Jan 2027", "2027-01-01"],
  ];
  for (const [instant, label, expected] of cases) {
    test(label, () => {
      expect(lockedThrough(openEveryDay, at(instant))).toBe(d(expected));
    });
  }

  test("dueDates crosses the year", () => {
    const daily = schedule({ daysOfWeek: [0, 1, 2, 3, 4, 5, 6], generatedThrough: d("2026-12-30") });
    expect(dueDates(daily, openEveryDay, at("2026-12-31T04:30:00Z"))).toEqual([
      d("2026-12-31"),
      d("2027-01-01"),
    ]);
  });
});

describe("isScheduledOn and wouldGenerate (AC-R8)", () => {
  const s = schedule({ startsOn: d("2026-10-06"), endsOn: d("2026-10-17") });

  test("one of its weekdays between start and end, both inclusive", () => {
    expect(isScheduledOn(s, closedMondays, d("2026-10-06"))).toBe(true); // Tue, the start
    expect(isScheduledOn(s, closedMondays, d("2026-10-17"))).toBe(true); // Sat, the end
    expect(isScheduledOn(s, closedMondays, d("2026-10-03"))).toBe(false); // Sat before the start
    expect(isScheduledOn(s, closedMondays, d("2026-10-20"))).toBe(false); // Tue after the end
    expect(isScheduledOn(s, closedMondays, d("2026-10-07"))).toBe(false); // Wed, not a chosen day
  });

  test("a weekday the branch now closes is never a pickup", () => {
    const tuesdaysClosed = branch([1, 2]);
    expect(isScheduledOn(s, tuesdaysClosed, d("2026-10-06"))).toBe(false);
  });

  test("skipped and paused dates aren't generated", () => {
    expect(wouldGenerate(s, closedMondays, d("2026-10-08"))).toBe(true);
    expect(wouldGenerate({ ...s, skipDates: [d("2026-10-08")] }, closedMondays, d("2026-10-08"))).toBe(false);
    expect(wouldGenerate({ ...s, status: "paused" }, closedMondays, d("2026-10-08"))).toBe(false);
  });
});

describe("dueDates: what generation still has to look at", () => {
  const afterCutoffSat = at("2026-10-10T04:30:00Z"); // Sat 10 Oct, 3:30pm AEDT

  test("the cursor at today: just tomorrow", () => {
    expect(dueDates(schedule({ generatedThrough: d("2026-10-10") }), closedMondays, afterCutoffSat)).toEqual([
      d("2026-10-11"),
    ]);
  });

  test("the cursor already at tomorrow: nothing (a rerun makes nothing)", () => {
    expect(dueDates(schedule({ generatedThrough: d("2026-10-11") }), closedMondays, afterCutoffSat)).toEqual([]);
  });

  test("yesterday's run missed: today and tomorrow", () => {
    expect(dueDates(schedule({ generatedThrough: d("2026-10-09") }), closedMondays, afterCutoffSat)).toEqual([
      d("2026-10-10"),
      d("2026-10-11"),
    ]);
  });

  test("never before today, however old the cursor (no back-fill, AC-R6)", () => {
    expect(dueDates(schedule({ generatedThrough: d("2026-09-01") }), closedMondays, afterCutoffSat)).toEqual([
      d("2026-10-10"),
      d("2026-10-11"),
    ]);
  });

  test("no cursor yet: from today", () => {
    expect(dueDates(schedule(), closedMondays, at("2026-10-10T02:00:00Z"))).toEqual([d("2026-10-10")]);
  });
});

describe("displayStatus", () => {
  const now = at("2026-10-07T02:00:00Z"); // Wed 7 Oct, 1pm: first changeable Thu 8 Oct

  test("active, paused, and ended once the end is before the first changeable date", () => {
    expect(displayStatus(schedule(), closedMondays, now)).toBe("active");
    expect(displayStatus(schedule({ status: "paused" }), closedMondays, now)).toBe("paused");
    expect(displayStatus(schedule({ endsOn: d("2026-10-07") }), closedMondays, now)).toBe("ended");
    expect(displayStatus(schedule({ endsOn: d("2026-10-08") }), closedMondays, now)).toBe("active");
  });

  test("stopped before its first pickup reads as ended, even far ahead", () => {
    const s = schedule({ startsOn: d("2026-11-03"), endsOn: d("2026-11-02") });
    expect(displayStatus(s, closedMondays, now)).toBe("ended");
  });
});

describe("upcomingPickups (C12)", () => {
  // Sat 10 Oct 3:30pm AEDT: today Sat and tomorrow Sun are locked.
  const now = at("2026-10-10T04:30:00Z");
  const daily = schedule({ daysOfWeek: [0, 2, 3, 4, 5, 6], generatedThrough: d("2026-10-10") });

  test("made, closing, open and skipped rows, closed Monday left out", () => {
    const made = new Map([[d("2026-10-10"), "MS-1042"]]);
    const rows = upcomingPickups({ ...daily, skipDates: [d("2026-10-13")] }, closedMondays, now, made);
    expect(rows).toEqual([
      { date: d("2026-10-10"), kind: "made", orderNumber: "MS-1042" },
      { date: d("2026-10-11"), kind: "closing" },
      { date: d("2026-10-13"), kind: "skipped" },
      { date: d("2026-10-14"), kind: "open" },
      { date: d("2026-10-15"), kind: "open" },
      { date: d("2026-10-16"), kind: "open" },
    ]);
  });

  test("a locked day generation already looked at, with nothing made, has no row", () => {
    const rows = upcomingPickups({ ...daily, generatedThrough: d("2026-10-11") }, closedMondays, now, noOrders);
    expect(rows[0]).toEqual({ date: d("2026-10-13"), kind: "open" });
  });

  test("a locked day that was skipped or paused before its cutoff isn't 'closing'", () => {
    const skipped = { ...daily, skipDates: [d("2026-10-11")] };
    expect(upcomingPickups(skipped, closedMondays, now, noOrders)[0].date).toBe(d("2026-10-13"));
  });

  test("paused: only orders already made (AC-R6)", () => {
    const made = new Map([[d("2026-10-11"), "MS-1050"]]);
    expect(upcomingPickups({ ...daily, status: "paused" }, closedMondays, now, made)).toEqual([
      { date: d("2026-10-11"), kind: "made", orderNumber: "MS-1050" },
    ]);
  });

  test("ended: only orders already made, and they still stand (AC-R7)", () => {
    const made = new Map([[d("2026-10-11"), "MS-1050"]]);
    const ended = { ...daily, endsOn: d("2026-10-11") };
    expect(upcomingPickups(ended, closedMondays, now, made)).toEqual([
      { date: d("2026-10-11"), kind: "made", orderNumber: "MS-1050" },
    ]);
  });

  test("nextPickup skips skipped days and finds a made one when paused", () => {
    const skippedFirst = { ...daily, generatedThrough: d("2026-10-11"), skipDates: [d("2026-10-13")] };
    expect(nextPickup(skippedFirst, closedMondays, now, noOrders)).toEqual({ date: d("2026-10-14"), kind: "open" });
    const made = new Map([[d("2026-10-11"), "MS-1050"]]);
    expect(nextPickup({ ...daily, status: "paused" }, closedMondays, now, made)?.kind).toBe("made");
    expect(nextPickup({ ...daily, status: "paused" }, closedMondays, now, noOrders)).toBeNull();
  });
});

describe("firstPickupFrom, stopNowEndsOn and endDateOptions", () => {
  const now = at("2026-10-10T04:30:00Z"); // Sat 10 Oct after the cutoff: first changeable Mon 12 Oct

  test("first pickup on or after a date, skipping closed days", () => {
    const mondaysAndTuesdays = { daysOfWeek: [1, 2] as Weekday[], startsOn: d("2026-10-01"), endsOn: null };
    expect(firstPickupFrom(mondaysAndTuesdays, closedMondays, d("2026-10-12"))).toBe(d("2026-10-13"));
    expect(firstPickupFrom({ ...mondaysAndTuesdays, daysOfWeek: [1] }, closedMondays, d("2026-10-12"))).toBeNull();
  });

  test("Stop now ends on the last locked date, so tomorrow's order stands", () => {
    expect(stopNowEndsOn(schedule(), closedMondays, now)).toBe(d("2026-10-11"));
  });

  test("Stop now before the first pickup ends the day before the start", () => {
    expect(stopNowEndsOn(schedule({ startsOn: d("2026-10-20") }), closedMondays, now)).toBe(d("2026-10-19"));
  });

  test("end options are its own changeable pickup days, without skipped ones", () => {
    const s = schedule({ skipDates: [d("2026-10-15")], endsOn: d("2026-10-17") });
    const options = endDateOptions(s, closedMondays, now);
    expect(options.slice(0, 4)).toEqual([d("2026-10-13"), d("2026-10-17"), d("2026-10-20"), d("2026-10-22")]);
  });
});
