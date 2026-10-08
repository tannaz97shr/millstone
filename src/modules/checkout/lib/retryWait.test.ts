import { describe, expect, test } from "bun:test";
import { waitMinutes } from "./retryWait";

describe("waitMinutes", () => {
  test("rounds up to whole minutes, so the customer never comes back too early", () => {
    expect(waitMinutes(60)).toBe(1);
    expect(waitMinutes(61)).toBe(2);
    expect(waitMinutes(1_799)).toBe(30);
    expect(waitMinutes(3_600)).toBe(60);
  });

  test("a few seconds still reads as one minute", () => {
    expect(waitMinutes(1)).toBe(1);
  });

  test("no usable header gives null (C5 says an hour)", () => {
    expect(waitMinutes(undefined)).toBeNull();
    expect(waitMinutes(0)).toBeNull();
    expect(waitMinutes(-5)).toBeNull();
    expect(waitMinutes(Number.NaN)).toBeNull();
  });
});
