import { describe, expect, test } from "bun:test";
import { withDeadline } from "./withDeadline";

const later = <T>(ms: number, value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));
const timeoutError = () => new Error("too slow");

describe("withDeadline", () => {
  test("a promise that settles in time passes its value through", async () => {
    expect(await withDeadline(later(5, "done"), 200, timeoutError)).toBe("done");
  });

  test("a promise slower than the deadline rejects with the timeout error", async () => {
    const started = performance.now();
    const result = withDeadline(later(500, "late"), 20, timeoutError);
    await expect(result).rejects.toThrow("too slow");
    expect(performance.now() - started).toBeLessThan(400);
  });

  test("a rejection in time keeps its own error", async () => {
    const failing = Promise.reject(new Error("permission denied"));
    await expect(withDeadline(failing, 200, timeoutError)).rejects.toThrow("permission denied");
  });

  test("the timer is cleared once the promise settles", async () => {
    let calls = 0;
    await withDeadline(later(1, "done"), 30, () => {
      calls += 1;
      return timeoutError();
    });
    await later(60, null);
    expect(calls).toBe(0);
  });
});
