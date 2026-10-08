import { describe, expect, test } from "bun:test";
import { junkNameReason, type OrderSummary, testOrderReason } from "./testOrderMatch";

const order = (overrides: Partial<OrderSummary>): OrderSummary => ({
  id: "2b1c6f0e-4a8e-4c43-9a49-0f1f7d6b8a11",
  orderNumber: "MS-1050",
  contactName: "Priya Nair",
  contactEmail: "priya.nair@example.com",
  ...overrides,
});

const none = new Set<string>();

describe("testOrderReason", () => {
  test("a real-looking order isn't matched", () => {
    expect(testOrderReason(order({}), none)).toBeNull();
  });

  test("test emails", () => {
    expect(testOrderReason(order({ contactEmail: "smoke-test@example.com" }), none)).toBe("smoke test email");
    expect(testOrderReason(order({ contactEmail: "smoke-limit-3@example.com" }), none)).toBe("smoke test email");
    expect(testOrderReason(order({ contactEmail: "batch.b.slow@example.com" }), none)).toBe("QA batch email");
    expect(testOrderReason(order({ contactEmail: "Batch.A@example.com" }), none)).toBe("QA batch email");
    expect(testOrderReason(order({ contactEmail: "stripe.test@example.com" }), none)).toBe("Stripe test email");
    expect(testOrderReason(order({ contactEmail: "stripe.test2@example.com" }), none)).toBe("Stripe test email");
  });

  test("similar emails elsewhere aren't matched", () => {
    expect(testOrderReason(order({ contactEmail: "batch.a@gmail.com" }), none)).toBeNull();
    expect(testOrderReason(order({ contactEmail: "my.batch.a@example.com" }), none)).toBeNull();
  });

  test("junk names", () => {
    expect(testOrderReason(order({ contactName: "Ttt" }), none)).toBe("name is one letter repeated");
  });

  test("orders named on the command line", () => {
    expect(testOrderReason(order({}), new Set(["MS-1050"]))).toBe("named with --order");
  });

  test("seed, generated and demo orders are never matched, even when named", () => {
    const named = new Set(["MS-1050"]);
    expect(testOrderReason(order({ id: "seed-ms-1042", contactName: "Ttt" }), named)).toBeNull();
    expect(testOrderReason(order({ id: "seed-corner-cup_2026-10-08", contactEmail: "batch.a@example.com" }), named)).toBeNull();
    expect(testOrderReason(order({ id: "demo-2026-10-08-nc-1" }), named)).toBeNull();
  });
});

describe("junkNameReason", () => {
  test("plausible names pass", () => {
    for (const name of ["Jo Bell", "Mei Lin", "Lyn", "Siân Ó Briain", "Corner Cup Cafe", "Nguyen", "Ng Wei"]) {
      expect(junkNameReason(name)).toBeNull();
    }
  });

  test("typed-to-test names are caught", () => {
    expect(junkNameReason("Ttt")).toBe("name is one letter repeated");
    expect(junkNameReason("a a a")).toBe("name is one letter repeated");
    expect(junkNameReason("x")).toBe("name has under 2 letters");
    expect(junkNameReason("123")).toBe("name has under 2 letters");
    expect(junkNameReason("Sdfg")).toBe("name has no vowels");
    expect(junkNameReason("Test Batch A")).toBe('name says "test"');
  });
});
