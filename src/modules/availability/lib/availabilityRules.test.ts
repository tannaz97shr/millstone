import { describe, expect, test } from "bun:test";
import type { AvailabilityState, BranchProduct, BranchSchedule, Product, TimeOfDay } from "@/shared/domain";
import { melbourneDateOf, pickupCalendar, toIsoDate } from "@/shared/utils/pickup-dates";
import type { AvailabilityProduct } from "../types/availability";
import {
  availabilityCounts,
  availabilityState,
  currentSoldOutDate,
  planAvailabilityAction,
  sameAvailability,
  withProductState,
} from "./availabilityRules";
import { buildAvailability } from "./buildAvailability";

// Instants are written in UTC. Melbourne is +10 (AEST) until 02:00 on
// Sun 4 Oct 2026, then +11 (AEDT).

const d = toIsoDate;
const at = (utc: string) => new Date(utc);

const closedMondays: BranchSchedule = { orderCutoffTime: "14:00" as TimeOfDay, closedDays: [1] };

const on: AvailabilityState = { isAvailable: true, soldOutOn: null };
const off: AvailabilityState = { isAvailable: false, soldOutOn: null };

describe("currentSoldOutDate", () => {
  test("a date after today still applies", () => {
    expect(currentSoldOutDate(d("2026-10-01"), d("2026-09-30"))).toBe(d("2026-10-01"));
  });

  test("today and earlier have passed", () => {
    expect(currentSoldOutDate(d("2026-09-30"), d("2026-09-30"))).toBeNull();
    expect(currentSoldOutDate(d("2026-09-29"), d("2026-09-30"))).toBeNull();
    expect(currentSoldOutDate(null, d("2026-09-30"))).toBeNull();
  });

  test("passes at Melbourne midnight, not UTC midnight", () => {
    // 23:59 Wed 30 Sep in Melbourne: sold out for Thu 1 Oct still applies.
    expect(currentSoldOutDate(d("2026-10-01"), melbourneDateOf(at("2026-09-30T13:59:00Z")))).toBe(d("2026-10-01"));
    // 00:00 Thu 1 Oct in Melbourne (still Wed in UTC): it has passed.
    expect(currentSoldOutDate(d("2026-10-01"), melbourneDateOf(at("2026-09-30T14:00:00Z")))).toBeNull();
  });

  test("across the daylight-saving change (midnight is 13:00 UTC from Sun 4 Oct)", () => {
    expect(currentSoldOutDate(d("2026-10-05"), melbourneDateOf(at("2026-10-04T12:59:00Z")))).toBe(d("2026-10-05"));
    expect(currentSoldOutDate(d("2026-10-05"), melbourneDateOf(at("2026-10-04T13:00:00Z")))).toBeNull();
  });
});

describe("availabilityState", () => {
  const today = d("2026-09-30");

  test("a missing row is on the menu and not sold out", () => {
    expect(availabilityState(undefined, today)).toEqual(on);
  });

  test("a passed sold-out date reads as null", () => {
    expect(availabilityState({ isAvailable: true, soldOutOn: d("2026-09-29") }, today)).toEqual(on);
    expect(availabilityState({ isAvailable: false, soldOutOn: d("2026-10-02") }, today)).toEqual({
      isAvailable: false,
      soldOutOn: d("2026-10-02"),
    });
  });

  test("sameAvailability compares both fields", () => {
    expect(sameAvailability(on, { isAvailable: true, soldOutOn: null })).toBe(true);
    expect(sameAvailability(on, off)).toBe(false);
    expect(sameAvailability(on, { isAvailable: true, soldOutOn: d("2026-10-01") })).toBe(false);
  });
});

describe("planAvailabilityAction", () => {
  // 13:00 Wed 30 Sep: before the cutoff, so Thu 1 Oct is the earliest.
  const calendar = pickupCalendar(closedMondays, at("2026-09-30T03:00:00Z"));
  const soldOutThu: AvailabilityState = { isAvailable: true, soldOutOn: d("2026-10-01") };

  test("switching on and off", () => {
    expect(planAvailabilityAction(off, { action: "switch_on" }, calendar)).toEqual({ ok: true, state: on });
    expect(planAvailabilityAction(on, { action: "switch_off" }, calendar)).toEqual({ ok: true, state: off });
  });

  test("switching off keeps a sold-out date", () => {
    expect(planAvailabilityAction(soldOutThu, { action: "switch_off" }, calendar)).toEqual({
      ok: true,
      state: { isAvailable: false, soldOutOn: d("2026-10-01") },
    });
  });

  test("switching to the state it's already in is refused", () => {
    expect(planAvailabilityAction(on, { action: "switch_on" }, calendar)).toEqual({ ok: false, problem: "not_allowed" });
    expect(planAvailabilityAction(off, { action: "switch_off" }, calendar)).toEqual({ ok: false, problem: "not_allowed" });
  });

  test("sold out for the earliest date and for a later one", () => {
    expect(planAvailabilityAction(on, { action: "mark_sold_out", date: d("2026-10-01") }, calendar)).toEqual({
      ok: true,
      state: soldOutThu,
    });
    expect(planAvailabilityAction(on, { action: "mark_sold_out", date: d("2026-10-03") }, calendar)).toEqual({
      ok: true,
      state: { isAvailable: true, soldOutOn: d("2026-10-03") },
    });
  });

  test("sold out is refused when off the menu or already sold out for a day", () => {
    expect(planAvailabilityAction(off, { action: "mark_sold_out", date: d("2026-10-01") }, calendar)).toEqual({
      ok: false,
      problem: "not_allowed",
    });
    expect(planAvailabilityAction(soldOutThu, { action: "mark_sold_out", date: d("2026-10-02") }, calendar)).toEqual({
      ok: false,
      problem: "not_allowed",
    });
  });

  test("sold out for a day that can't be ordered says why", () => {
    const mark = (date: string) => planAvailabilityAction(on, { action: "mark_sold_out", date: d(date) }, calendar);
    expect(mark("2026-09-30")).toEqual({ ok: false, problem: "past_cutoff" });
    expect(mark("2026-10-05")).toEqual({ ok: false, problem: "closed_day" });
    expect(mark("2026-10-30")).toEqual({ ok: false, problem: "out_of_range" });
  });

  test("after the cutoff, tomorrow can no longer be marked", () => {
    const late = pickupCalendar(closedMondays, at("2026-09-30T04:00:00Z"));
    expect(planAvailabilityAction(on, { action: "mark_sold_out", date: d("2026-10-01") }, late)).toEqual({
      ok: false,
      problem: "past_cutoff",
    });
  });

  test("back on sale clears the date, and needs one", () => {
    expect(planAvailabilityAction(soldOutThu, { action: "back_on_sale" }, calendar)).toEqual({ ok: true, state: on });
    expect(planAvailabilityAction(on, { action: "back_on_sale" }, calendar)).toEqual({ ok: false, problem: "not_allowed" });
  });
});

const product = (id: string, category: string, name: string, isActive = true): Product =>
  ({
    id,
    name,
    description: "",
    category,
    priceCents: 500,
    image: null,
    isActive,
  }) as Product;

const row = (productId: string, isAvailable: boolean, soldOutOn: string | null = null): BranchProduct =>
  ({ branchId: "northcote", productId, isAvailable, soldOutOn: soldOutOn ? d(soldOutOn) : null }) as BranchProduct;

describe("buildAvailability", () => {
  const products = [
    product("white", "Breads", "White sourdough"),
    product("rye", "Breads", "Sourdough rye loaf"),
    product("pumpkin", "Breads", "Pumpkin loaf", false),
    product("bagel", "Bagels", "Plain bagel"),
    product("scroll", "Pastries", "Cinnamon scroll"),
    product("pie", "Savoury", "Pie"),
  ];

  const categories = buildAvailability({
    products,
    branchProducts: [row("rye", false), row("scroll", true, "2026-10-01"), row("bagel", true, "2026-09-29")],
    categoryOrder: ["Breads", "Pastries", "Bagels"],
    today: d("2026-09-30"),
  });

  test("categories follow the stored order, then A–Z; products A–Z; hidden ones left out", () => {
    expect(categories.map((c) => c.name)).toEqual(["Breads", "Pastries", "Bagels", "Savoury"]);
    expect(categories[0].products.map((p) => p.id)).toEqual(["rye", "white"]);
    expect(categories[0].slug).toBe("breads");
  });

  test("rows give each product's state; missing rows and passed dates read as on", () => {
    const states = Object.fromEntries(categories.flatMap((c) => c.products).map((p) => [p.id, p.state]));
    expect(states.rye).toEqual(off);
    expect(states.white).toEqual(on);
    expect(states.scroll).toEqual({ isAvailable: true, soldOutOn: d("2026-10-01") });
    expect(states.bagel).toEqual(on);
  });
});

describe("availabilityCounts and withProductState", () => {
  const list = (states: AvailabilityState[]): AvailabilityProduct[] =>
    states.map((state, i) => ({ id: `p${i}`, name: `P${i}`, state }) as AvailabilityProduct);

  test("counts on, off and sold out (sold out only while on)", () => {
    const counts = availabilityCounts(
      list([on, off, { isAvailable: true, soldOutOn: d("2026-10-01") }, { isAvailable: false, soldOutOn: d("2026-10-01") }]),
    );
    expect(counts).toEqual({ products: 4, on: 2, off: 2, soldOut: 1 });
  });

  test("withProductState replaces one product's state", () => {
    const categories = [{ name: "Breads", slug: "breads", products: list([on, on]) }];
    const next = withProductState(categories, categories[0].products[1].id, off);
    expect(next[0].products.map((p) => p.state)).toEqual([on, off]);
    expect(categories[0].products[1].state).toEqual(on);
  });
});
