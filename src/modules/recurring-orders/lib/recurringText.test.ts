import { describe, expect, test } from "bun:test";
import type { IsoDate, TimeOfDay, Weekday } from "@/shared/domain";
import type { UpcomingPickup } from "@/shared/utils/pickup-dates";
import type { RecurringBranchView, RecurringOrderSummary } from "../types/recurringOrderView";
import {
  accountSummary,
  cutoffBefore,
  dayLabel,
  daysText,
  endConfirmLabel,
  endedTitle,
  endsLabel,
  itemLines,
  nextLine,
  noUpcomingText,
  rowCaption,
  sharedCutoff,
} from "./recurringText";

const d = (value: string) => value as IsoDate;
const TODAY = d("2026-10-11"); // a Sunday

const branch: RecurringBranchView = {
  id: "northcote" as RecurringBranchView["id"],
  name: "Northcote",
  address: "214 High Street, Northcote",
  phone: "0370102140",
  orderCutoffTime: "14:00" as TimeOfDay,
  closedDays: [1],
};

function summary(over: Partial<RecurringOrderSummary> = {}): RecurringOrderSummary {
  return {
    id: "r1" as RecurringOrderSummary["id"],
    version: 0,
    branch,
    daysOfWeek: [2, 4, 6],
    status: "active",
    items: [],
    startsOn: d("2026-09-01"),
    endsOn: null,
    next: { date: d("2026-10-13"), kind: "open" },
    ...over,
  };
}

describe("daysText", () => {
  test("lists days Monday first, Sunday last, as the designs do", () => {
    expect(daysText([6, 2, 4] as Weekday[])).toBe("Tue, Thu and Sat");
    expect(daysText([0, 2] as Weekday[])).toBe("Tue and Sun");
    expect(daysText([6] as Weekday[])).toBe("Sat");
  });
});

describe("dayLabel", () => {
  test("today says so", () => {
    expect(dayLabel(TODAY, TODAY)).toBe("Today, Sun 11 Oct");
    expect(dayLabel(d("2026-10-13"), TODAY)).toBe("Tue 13 Oct");
  });
});

test("itemLines", () => {
  expect(itemLines([{ quantity: 12, name: "Plain bagel" }])).toEqual(["12 × Plain bagel"]);
});

describe("cutoffBefore", () => {
  test("the day before at the branch's time, across a month end", () => {
    expect(cutoffBefore(d("2026-10-13"), "14:00" as TimeOfDay)).toBe("2pm Mon 12 Oct");
    expect(cutoffBefore(d("2026-11-01"), "13:30" as TimeOfDay)).toBe("1:30pm Sat 31 Oct");
  });
});

describe("sharedCutoff", () => {
  test("one time for all, or null", () => {
    expect(sharedCutoff([{ orderCutoffTime: "14:00" as TimeOfDay }, { orderCutoffTime: "14:00" as TimeOfDay }])).toBe("2pm");
    expect(sharedCutoff([{ orderCutoffTime: "14:00" as TimeOfDay }, { orderCutoffTime: "15:00" as TimeOfDay }])).toBeNull();
  });
});

describe("nextLine (C10)", () => {
  test("active: the next pickup, with the last pickup when there's an end", () => {
    expect(nextLine(summary(), TODAY)).toBe("Next pickup Tue 13 Oct");
    expect(nextLine(summary({ endsOn: d("2026-10-31") }), TODAY)).toBe("Next pickup Tue 13 Oct · last pickup Sat 31 Oct");
    expect(nextLine(summary({ next: { date: TODAY, kind: "closing" } }), TODAY)).toBe("Next pickup Today, Sun 11 Oct");
    expect(nextLine(summary({ next: null }), TODAY)).toBe("No pickups coming up");
  });

  test("paused: names a made order that still stands, else says nothing is made", () => {
    expect(
      nextLine(summary({ status: "paused", next: { date: TODAY, kind: "made", orderNumber: "MS-1042" } }), TODAY),
    ).toBe("Paused. Today, Sun 11 Oct’s order (MS-1042) still stands.");
    expect(nextLine(summary({ status: "paused", next: null }), TODAY)).toBe("Paused. No new orders until you resume.");
  });

  test("ended", () => {
    expect(nextLine(summary({ status: "ended", endsOn: d("2026-10-10") }), TODAY)).toBe("Ended. No more orders.");
  });
});

describe("accountSummary (C9)", () => {
  test("none live: the invitation", () => {
    expect(accountSummary({ recurringOrders: [], today: TODAY })).toBe(
      "Get the same order on the days you choose, made the day before.",
    );
    expect(accountSummary({ recurringOrders: [summary({ status: "ended", next: null })], today: TODAY })).toBe(
      "Get the same order on the days you choose, made the day before.",
    );
  });

  test("counts live ones and names the soonest pickup across them", () => {
    const soon = summary({ next: { date: TODAY, kind: "made", orderNumber: "MS-1" } });
    expect(accountSummary({ recurringOrders: [summary(), soon], today: TODAY })).toBe(
      "2 recurring orders. Next pickup Today, Sun 11 Oct.",
    );
    expect(accountSummary({ recurringOrders: [summary()], today: TODAY })).toBe(
      "1 recurring order. Next pickup Tue 13 Oct.",
    );
  });

  test("no pickup coming: just the count", () => {
    expect(accountSummary({ recurringOrders: [summary({ status: "paused", next: null })], today: TODAY })).toBe(
      "1 recurring order.",
    );
  });
});

describe("rowCaption (C12)", () => {
  const row = (r: UpcomingPickup) => rowCaption(r, branch);

  test("made and closing end in a call to the branch", () => {
    expect(row({ date: d("2026-10-13"), kind: "made", orderNumber: "MS-1042" })).toEqual({
      kind: "call",
      before: "Order MS-1042 is made. To change it, call Northcote on ",
    });
    expect(row({ date: TODAY, kind: "closing" })).toEqual({
      kind: "call",
      before: "Ordering for this day closed at 2pm Sat 10 Oct. To change it, call Northcote on ",
    });
  });

  test("skipped and open name the cutoff", () => {
    expect(row({ date: d("2026-10-13"), kind: "skipped" })).toEqual({
      kind: "text",
      text: "Skipped. Undo until 2pm Mon 12 Oct.",
    });
    expect(row({ date: d("2026-10-15"), kind: "open" })).toEqual({
      kind: "text",
      text: "Skip or change until 2pm Wed 14 Oct.",
    });
  });
});

describe("endedTitle", () => {
  test("after its last pickup, or before it began", () => {
    expect(endedTitle({ startsOn: d("2026-09-01"), endsOn: d("2026-10-10") })).toBe("Ended after Sat 10 Oct");
    expect(endedTitle({ startsOn: d("2026-10-13"), endsOn: d("2026-10-12") })).toBe("Ended before its first pickup");
  });
});

describe("noUpcomingText", () => {
  test("paused and ended always say so; active only when empty", () => {
    expect(noUpcomingText({ status: "ended", upcoming: [] })).toBe("No more pickups.");
    expect(noUpcomingText({ status: "paused", upcoming: [{ date: TODAY, kind: "made", orderNumber: "MS-1" }] })).toBe(
      "No new pickups while paused.",
    );
    expect(noUpcomingText({ status: "active", upcoming: [] })).toBe("No pickups in the next few weeks.");
    expect(noUpcomingText({ status: "active", upcoming: [{ date: TODAY, kind: "open" }] })).toBeNull();
  });
});

describe("endConfirmLabel", () => {
  test("says what it will do", () => {
    expect(endConfirmLabel("now", null)).toBe("End it now");
    expect(endConfirmLabel("date", d("2026-10-17"))).toBe("End after Sat 17 Oct");
    expect(endConfirmLabel("date", null)).toBe("Choose a last pickup day");
  });
});

test("endsLabel", () => {
  expect(endsLabel(null)).toBe("No end date");
  expect(endsLabel(d("2026-10-17"))).toBe("After Sat 17 Oct");
});
