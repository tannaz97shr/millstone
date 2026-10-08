import { describe, expect, test } from "bun:test";
import type { IsoDate } from "@/shared/domain";
import { type DemoStep, demoOrderId, dueSteps, isDemoOrderId, placedAt, remainingSteps, stampInstant } from "./demoTimeline";

const THU = "2026-10-08" as IsoDate;
// 11:30am Thu 8 Oct in Melbourne (AEDT, UTC+11).
const lateMorning = new Date("2026-10-08T00:30:00Z");
// 7:30am Thu 8 Oct.
const early = new Date("2026-10-07T20:30:00Z");

const collected: DemoStep[] = [
  { action: "ready", at: "07:05" },
  { action: "collect", at: "08:12" },
];

describe("demo IDs", () => {
  test("carry the prefix and the pickup day", () => {
    expect(demoOrderId(THU, "nc-1")).toBe("demo-2026-10-08-nc-1");
    expect(isDemoOrderId("demo-2026-10-08-nc-1")).toBe(true);
    expect(isDemoOrderId("seed-ms-1042")).toBe(false);
    expect(isDemoOrderId("2b1c6f0e-4a8e-4c43-9a49-0f1f7d6b8a11")).toBe(false);
  });
});

describe("stampInstant", () => {
  test("Melbourne wall time, days from the pickup day", () => {
    expect(stampInstant(THU, { daysFrom: -1, time: "11:42" }).toISOString()).toBe("2026-10-07T00:42:00.000Z");
  });
});

describe("placedAt", () => {
  test("a stamp in the past is kept", () => {
    expect(placedAt(THU, { daysFrom: -1, time: "11:42" }, lateMorning, 0).toISOString()).toBe(
      "2026-10-07T00:42:00.000Z",
    );
  });

  test("a stamp after now moves to before now, a minute apart by index", () => {
    const tomorrow = "2026-10-09" as IsoDate;
    const a = placedAt(tomorrow, { daysFrom: -1, time: "10:20" }, early, 0);
    const b = placedAt(tomorrow, { daysFrom: -1, time: "10:40" }, early, 1);
    expect(a.getTime()).toBeLessThan(early.getTime());
    expect(b.getTime()).toBeLessThan(early.getTime());
    expect(b.getTime() - a.getTime()).toBe(60_000);
  });
});

describe("remainingSteps", () => {
  test("placed: every step", () => {
    expect(remainingSteps(collected, "placed")).toEqual(collected);
  });

  test("after a step: the ones after it", () => {
    expect(remainingSteps(collected, "ready")).toEqual([collected[1]]);
    expect(remainingSteps(collected, "collected")).toEqual([]);
  });

  test("a status the script never reaches means someone changed it: leave it alone", () => {
    expect(remainingSteps(collected, "cancelled")).toBeNull();
    expect(remainingSteps([], "ready")).toBeNull();
  });
});

describe("dueSteps", () => {
  test("steps whose time has passed, in order", () => {
    expect(dueSteps(collected, THU, lateMorning)).toEqual(collected);
    expect(dueSteps(collected, THU, early)).toEqual([collected[0]]);
  });

  test("stops at the first step not yet due", () => {
    const steps: DemoStep[] = [
      { action: "ready", at: "09:00" },
      { action: "collect", at: "07:00" },
    ];
    expect(dueSteps(steps, THU, early)).toEqual([]);
  });

  test("nothing happens on a pickup day that isn't today", () => {
    expect(dueSteps(collected, "2026-10-09" as IsoDate, lateMorning)).toEqual([]);
  });
});
