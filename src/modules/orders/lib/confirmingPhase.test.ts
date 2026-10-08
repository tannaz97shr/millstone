import { describe, expect, test } from "bun:test";
import {
  checkAgainStart,
  confirmingInterval,
  confirmingPhase,
  msUntilNextPhase,
} from "./confirmingPhase";

const SECOND = 1_000;
const MINUTE = 60 * SECOND;

describe("confirmingPhase", () => {
  test("Confirming for the first 20 seconds", () => {
    expect(confirmingPhase(0)).toBe("fast");
    expect(confirmingPhase(20 * SECOND - 1)).toBe("fast");
  });

  test("ConfirmingSlow from 20 seconds, still polling for 5 minutes", () => {
    expect(confirmingPhase(20 * SECOND)).toBe("slow");
    expect(confirmingPhase(20 * SECOND + 5 * MINUTE - 1)).toBe("slow");
  });

  test("polling stops after that", () => {
    expect(confirmingPhase(20 * SECOND + 5 * MINUTE)).toBe("stopped");
    expect(confirmingPhase(2 * 60 * MINUTE)).toBe("stopped");
  });
});

describe("confirmingInterval", () => {
  test("every 2s, then every 5s, then not at all", () => {
    expect(confirmingInterval("fast")).toBe(2 * SECOND);
    expect(confirmingInterval("slow")).toBe(5 * SECOND);
    expect(confirmingInterval("stopped")).toBe(false);
  });
});

describe("msUntilNextPhase", () => {
  test("counts down to each boundary, then null", () => {
    expect(msUntilNextPhase(0)).toBe(20 * SECOND);
    expect(msUntilNextPhase(15 * SECOND)).toBe(5 * SECOND);
    expect(msUntilNextPhase(20 * SECOND)).toBe(5 * MINUTE);
    expect(msUntilNextPhase(20 * SECOND + 5 * MINUTE)).toBeNull();
  });
});

describe("checkAgainStart", () => {
  test("Check again gives a fresh 5 minutes of slow polling, never the fast Confirming again", () => {
    const now = 10_000_000;
    const start = checkAgainStart(now);
    expect(confirmingPhase(now - start)).toBe("slow");
    expect(msUntilNextPhase(now - start)).toBe(5 * MINUTE);
  });
});
