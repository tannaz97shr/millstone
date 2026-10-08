import { describe, expect, test } from "bun:test";
import type { IsoDate, OrderId, ProductId } from "@/shared/domain";
import type { ApiFailure } from "@/shared/lib/http/apiClient";
import { placeOrderProblem } from "./placeOrderOutcome";

const TUE = "2026-10-06" as IsoDate;
const failure = (code: ApiFailure["code"], details: Partial<ApiFailure> = {}): ApiFailure => ({
  status: 409,
  code,
  ...details,
});

describe("placeOrderProblem", () => {
  test("each date problem moves the cart to the earliest day, saying whether the branch is closed", () => {
    expect(placeOrderProblem(failure("closed_day", { earliest: TUE }))).toEqual({
      kind: "date_moved",
      earliest: TUE,
      closed: true,
    });
    for (const code of ["past_cutoff", "out_of_range"] as const) {
      expect(placeOrderProblem(failure(code, { earliest: TUE }))).toEqual({
        kind: "date_moved",
        earliest: TUE,
        closed: false,
      });
    }
  });

  test("unavailable items are removed with C4's reasons: sold out, or no longer on the menu", () => {
    expect(
      placeOrderProblem(
        failure("items_unavailable", {
          items: [
            { productId: "rye" as ProductId, name: "Sourdough rye loaf", reason: "sold_out" },
            { productId: "fruit" as ProductId, name: "Fruit loaf", reason: "not_available" },
          ],
        }),
      ),
    ).toEqual({
      kind: "items_removed",
      productIds: ["rye" as ProductId, "fruit" as ProductId],
      removed: { notMadeHere: [], soldOut: ["Sourdough rye loaf"], noLongerOffered: ["Fruit loaf"] },
    });
  });

  test("a changed price carries the server's total", () => {
    expect(placeOrderProblem(failure("price_changed", { totalCents: 2120 }))).toEqual({
      kind: "price_changed",
      totalCents: 2120,
    });
  });

  test("a reused checkout key carries the order it placed", () => {
    const existingOrder = { orderId: "abc" as OrderId, orderNumber: "MS-1007" };
    expect(placeOrderProblem(failure("checkout_key_mismatch", { existingOrder }))).toEqual({
      kind: "key_mismatch",
      ...existingOrder,
    });
  });

  test("invalid contact fields map to the form's fields", () => {
    expect(
      placeOrderProblem(failure("invalid_body", { fields: ["contact.phone", "contact.email", "notes"] })),
    ).toEqual({ kind: "fields", fields: ["phone", "email", "notes"] });
  });

  test("an invalid field the customer can't fix is a failure", () => {
    expect(placeOrderProblem(failure("invalid_body", { fields: ["items.0.quantity"] }))).toEqual({ kind: "failed" });
    expect(placeOrderProblem(failure("invalid_body", { fields: ["contact.phone", "checkoutKey"] }))).toEqual({
      kind: "failed",
    });
  });

  test("a missing branch goes back to C4", () => {
    expect(placeOrderProblem(failure("unknown_branch"))).toEqual({ kind: "branch_gone" });
  });

  test("too many orders from this address says so, without Try again, with the wait from Retry-After", () => {
    expect(placeOrderProblem(failure("rate_limited", { status: 429, retryAfterSeconds: 1_500 }))).toEqual({
      kind: "rate_limited",
      waitMinutes: 25,
    });
    expect(placeOrderProblem(failure("rate_limited", { status: 429 }))).toEqual({
      kind: "rate_limited",
      waitMinutes: null,
    });
  });

  test("an abandoned online payment asks for a new checkout key", () => {
    expect(placeOrderProblem(failure("payment_abandoned"))).toEqual({ kind: "payment_abandoned" });
  });

  test("a payment page that couldn't open has its own notice", () => {
    expect(placeOrderProblem(failure("payment_unavailable", { status: 503 }))).toEqual({
      kind: "payment_unavailable",
    });
  });

  test("no answer, a server error, an outage or a missing detail all offer Try again", () => {
    for (const code of ["network_error", "server_error", "unavailable", "payment_method_unavailable"] as const) {
      expect(placeOrderProblem(failure(code))).toEqual({ kind: "failed" });
    }
    expect(placeOrderProblem(failure("past_cutoff"))).toEqual({ kind: "failed" });
    expect(placeOrderProblem(failure("price_changed"))).toEqual({ kind: "failed" });
    expect(placeOrderProblem(failure("items_unavailable", { items: [] }))).toEqual({ kind: "failed" });
  });
});
