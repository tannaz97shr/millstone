import { describe, expect, test } from "bun:test";
import { checkoutContent } from "../content/checkoutContent";
import { checkoutFormSchema, placeOrderRequestSchema, type PlaceOrderRequest } from "./checkoutSchema";

const errors = checkoutContent.errors;

const form = {
  name: "Ben Okafor",
  phone: "0491 570 157",
  email: "ben.okafor@example.com",
  notes: "",
  paymentMethod: "at_pickup",
};

/** The message for each failing field, keyed by its path. */
function fieldErrors(input: unknown) {
  const result = checkoutFormSchema.safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]));
}

describe("checkoutFormSchema", () => {
  test("normalises what was typed", () => {
    const parsed = checkoutFormSchema.parse({
      ...form,
      name: "  Ben Okafor ",
      phone: "+61 491 570 157",
      email: "  Ben.Okafor@Example.COM ",
      notes: "  Sliced, please  ",
    });
    expect(parsed).toEqual({
      name: "Ben Okafor",
      phone: "0491570157",
      email: "ben.okafor@example.com",
      notes: "Sliced, please",
      paymentMethod: "at_pickup",
    });
  });

  test("CheckoutErrors.dc.html: each field's sentence, and a missing payment choice", () => {
    expect(
      fieldErrors({ name: " ", phone: "0491 570", email: "ben.okafor@example", notes: "", paymentMethod: "" }),
    ).toEqual({
      name: errors.name,
      phone: errors.phone,
      email: errors.email,
      paymentMethod: errors.paymentMethod,
    });
  });

  test("a landline or a 9-digit number isn't a mobile", () => {
    expect(fieldErrors({ ...form, phone: "03 7010 2140" })).toEqual({ phone: errors.phone });
    expect(fieldErrors({ ...form, phone: "049157015" })).toEqual({ phone: errors.phone });
  });

  test("notes are optional but limited to 500 characters", () => {
    expect(fieldErrors({ ...form, notes: "x".repeat(500) })).toEqual({});
    expect(fieldErrors({ ...form, notes: "x".repeat(501) })).toEqual({ notes: errors.notesTooLong });
  });

  test("a name over 100 characters is refused", () => {
    expect(fieldErrors({ ...form, name: "x".repeat(101) })).toEqual({ name: errors.nameTooLong });
  });
});

const request: PlaceOrderRequest = {
  checkoutKey: "6f1c2a9e-3b7d-4c41-9a2e-8d5f0b7c1e23",
  branchId: "northcote",
  pickupDate: "2026-10-07",
  items: [
    { productId: "sourdough-rye-loaf", quantity: 1 },
    { productId: "plain-bagel", quantity: 4 },
  ],
  contact: { name: "Ben Okafor", phone: "0491 570 157", email: "Ben.Okafor@example.com" },
  notes: "",
  paymentMethod: "at_pickup",
  expectedTotalCents: 2070,
};

const failingPaths = (input: unknown) => {
  const result = placeOrderRequestSchema.safeParse(input);
  return result.success ? [] : [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
};

describe("placeOrderRequestSchema", () => {
  test("accepts a checkout and normalises the contact", () => {
    const parsed = placeOrderRequestSchema.parse(request);
    expect(parsed.contact).toEqual({ name: "Ben Okafor", phone: "0491570157", email: "ben.okafor@example.com" });
  });

  test("the checkout key must be a v4 UUID", () => {
    expect(failingPaths({ ...request, checkoutKey: "abc" })).toEqual(["checkoutKey"]);
  });

  test("items: at least one, quantities 1–99, each product once", () => {
    expect(failingPaths({ ...request, items: [] })).toEqual(["items"]);
    expect(failingPaths({ ...request, items: [{ productId: "plain-bagel", quantity: 0 }] })).toEqual([
      "items.0.quantity",
    ]);
    expect(failingPaths({ ...request, items: [{ productId: "plain-bagel", quantity: 100 }] })).toEqual([
      "items.0.quantity",
    ]);
    expect(
      failingPaths({
        ...request,
        items: [
          { productId: "plain-bagel", quantity: 1 },
          { productId: "plain-bagel", quantity: 2 },
        ],
      }),
    ).toEqual(["items"]);
  });

  test("a price sent per line is not part of the request", () => {
    const parsed = placeOrderRequestSchema.parse({
      ...request,
      items: [{ productId: "plain-bagel", quantity: 1, unitPriceCents: 1 }],
    });
    expect(parsed.items).toEqual([{ productId: "plain-bagel" as never, quantity: 1 }]);
  });

  test("names the contact fields that fail", () => {
    expect(failingPaths({ ...request, contact: { name: "", phone: "1", email: "x" } })).toEqual([
      "contact.name",
      "contact.phone",
      "contact.email",
    ]);
  });
});
