import { describe, expect, test } from "bun:test";
import type { OrderStatus } from "@/shared/domain";
import { isVisibleToCustomer } from "./toAccountOrder";

describe("isVisibleToCustomer (C9 history and the account order page)", () => {
  test.each(["placed", "ready", "collected", "cancelled"] as OrderStatus[])("%s shows", (status) => {
    expect(isVisibleToCustomer(status)).toBe(true);
  });

  test("an online order waiting for its webhook doesn't show yet", () => {
    expect(isVisibleToCustomer("awaiting_payment")).toBe(false);
  });

  test("an online order that expired unpaid never shows", () => {
    expect(isVisibleToCustomer("expired")).toBe(false);
  });

  test("the same order shows once the webhook has placed it", () => {
    const before: OrderStatus = "awaiting_payment";
    const after: OrderStatus = "placed";
    expect([isVisibleToCustomer(before), isVisibleToCustomer(after)]).toEqual([false, true]);
  });
});
