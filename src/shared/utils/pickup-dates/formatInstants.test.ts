import { describe, expect, test } from "bun:test";
import type { IsoInstant } from "@/shared/domain";
import { formatMelbourneStamp, formatMelbourneTime } from ".";

describe("formatMelbourneTime", () => {
  test("AEST (+10) in winter", () => {
    expect(formatMelbourneTime(new Date("2026-07-14T22:05:00Z"))).toBe("8:05am");
  });

  test("AEDT (+11) in summer", () => {
    expect(formatMelbourneTime(new Date("2026-12-01T22:41:00Z"))).toBe("9:41am");
  });

  test("noon and midnight", () => {
    expect(formatMelbourneTime(new Date("2026-07-15T02:00:00Z"))).toBe("12pm");
    expect(formatMelbourneTime(new Date("2026-07-14T14:00:00Z"))).toBe("12am");
  });

  test("seconds are dropped, not rounded", () => {
    expect(formatMelbourneTime(new Date("2026-07-14T22:05:59Z"))).toBe("8:05am");
  });
});

describe("formatMelbourneStamp", () => {
  test("carries the Melbourne date, not the UTC one", () => {
    // 29 Sep 2026 21:15 UTC is already Wed 30 Sep in Melbourne (AEST, +10).
    expect(formatMelbourneStamp(new Date("2026-09-29T21:15:00Z"))).toBe("7:15am Wed 30 Sep");
  });

  test("accepts an ISO string", () => {
    expect(formatMelbourneStamp("2026-09-28T10:15:00.000Z" as IsoInstant)).toBe("8:15pm Mon 28 Sep");
  });

  test("daylight saving starts: 2am jumps to 3am on Sun 4 Oct 2026", () => {
    expect(formatMelbourneStamp(new Date("2026-10-03T15:59:00Z"))).toBe("1:59am Sun 4 Oct");
    expect(formatMelbourneStamp(new Date("2026-10-03T16:00:00Z"))).toBe("3am Sun 4 Oct");
  });

  test("daylight saving ends: 3am goes back to 2am on Sun 5 Apr 2026", () => {
    expect(formatMelbourneStamp(new Date("2026-04-04T15:30:00Z"))).toBe("2:30am Sun 5 Apr");
    expect(formatMelbourneStamp(new Date("2026-04-04T16:30:00Z"))).toBe("2:30am Sun 5 Apr");
    expect(formatMelbourneStamp(new Date("2026-04-04T17:00:00Z"))).toBe("3am Sun 5 Apr");
  });
});
