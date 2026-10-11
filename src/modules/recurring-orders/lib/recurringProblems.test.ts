import { describe, expect, test } from "bun:test";
import type { IsoDate, ProductId, Weekday } from "@/shared/domain";
import type { ApiFailure } from "@/shared/lib/http/apiClient";
import { recurringProblem, type ProblemContext } from "./recurringProblems";

const ctx: ProblemContext = {
  branch: { name: "Northcote", phone: "0370102140", closedDays: [1] as Weekday[] },
  date: "2026-10-13" as IsoDate,
};
const fail = (code: ApiFailure["code"], extra: Partial<ApiFailure> = {}) => ({ code, ...extra });

describe("recurringProblem", () => {
  test("a version clash reloads and says why", () => {
    expect(recurringProblem(fail("recurring_changed"), ctx)).toEqual({
      text: "This recurring order changed in another window, so we've loaded the latest version. Check it and try again.",
      refetch: true,
      expected: true,
    });
  });

  test("a closed day ends in a call to the branch and reloads", () => {
    expect(recurringProblem(fail("date_locked"), ctx)).toEqual({
      text: "Ordering for Tue 13 Oct has closed, so it can't change here. Call Northcote on ",
      callPhone: "0370102140",
      refetch: true,
      expected: true,
    });
    expect(recurringProblem(fail("date_locked"), { ...ctx, date: null }).text).toStartWith("Ordering for that day");
  });

  test("not allowed: ended, or paused for a skip", () => {
    expect(recurringProblem(fail("not_allowed"), ctx).text).toBe("This recurring order has ended, so it can't be changed.");
    expect(recurringProblem(fail("not_allowed"), { ...ctx, paused: true }).text).toBe(
      "Resume this recurring order to skip a day.",
    );
  });

  test("form refusals name what to fix", () => {
    expect(recurringProblem(fail("closed_day"), ctx).text).toBe("Northcote is closed on Mondays. Take that day off to save.");
    expect(
      recurringProblem(
        fail("items_unavailable", {
          items: [{ productId: "fruit-loaf" as ProductId, name: "Fruit loaf", reason: "not_available" }],
        }),
        ctx,
      ).text,
    ).toBe("Fruit loaf isn't on the menu at Northcote now. Remove it to save.");
    expect(recurringProblem(fail("start_too_early", { earliest: "2026-10-14" as IsoDate }), ctx).text).toBe(
      "The earliest start is now Wed 14 Oct. Choose that day or later.",
    );
    expect(recurringProblem(fail("not_scheduled"), ctx).text).toBe("Choose one of your pickup days.");
    expect(recurringProblem(fail("limit_reached"), ctx).text).toBe(
      "You already have 10 recurring orders, the most one account can have. End one to set up another.",
    );
  });

  test("busy and limits are expected; anything else is a failure", () => {
    expect(recurringProblem(fail("try_again"), ctx)).toMatchObject({ text: "We couldn't save that just now. Try again.", expected: true });
    expect(recurringProblem(fail("rate_limited"), ctx).expected).toBe(true);
    expect(recurringProblem(fail("network_error"), ctx)).toEqual({
      text: "We couldn't save that just now. Check your connection and try again.",
      refetch: false,
      expected: false,
    });
  });
});
