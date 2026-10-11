import { describe, expect, test } from "bun:test";
import type {
  BranchId,
  BranchProduct,
  BranchSchedule,
  CustomerId,
  IsoDate,
  IsoInstant,
  Product,
  ProductId,
  RecurringOrder,
  RecurringOrderId,
  TimeOfDay,
} from "@/shared/domain";
import { toIsoDate } from "@/shared/utils/pickup-dates";
import { hasDueOrders, planGeneration, type PlanGenerationInput } from "./planGeneration";

// Sat 10 Oct 2026, 3:30pm AEDT: today (Sat) and tomorrow (Sun) are locked.
const AFTER_CUTOFF = new Date("2026-10-10T04:30:00Z");
const d = toIsoDate;

const branch: BranchSchedule = { orderCutoffTime: "14:00" as TimeOfDay, closedDays: [1] };
const RYE = "sourdough-rye-loaf" as ProductId;
const BAGEL = "plain-bagel" as ProductId;
const FRUIT = "fruit-loaf" as ProductId;

const product = (id: ProductId, name: string, priceCents: number, isActive = true): Product => ({
  id,
  name,
  description: "",
  category: "Breads",
  priceCents,
  image: null,
  isActive,
  version: 0,
});

const catalogue = new Map<ProductId, Product>([
  [RYE, product(RYE, "Sourdough rye loaf", 950)],
  [BAGEL, product(BAGEL, "Plain bagel", 280)],
  [FRUIT, product(FRUIT, "Fruit loaf", 750)],
]);

const row = (productId: ProductId, overrides: Partial<BranchProduct> = {}): BranchProduct => ({
  branchId: "northcote" as BranchId,
  productId,
  isAvailable: true,
  soldOutOn: null,
  ...overrides,
});

const recurring = (overrides: Partial<RecurringOrder> = {}): RecurringOrder => ({
  id: "rec-1" as RecurringOrderId,
  customerId: "cafe" as CustomerId,
  branchId: "northcote" as BranchId,
  daysOfWeek: [0, 2, 3, 4, 5, 6],
  status: "active",
  startsOn: d("2026-09-01"),
  endsOn: null,
  notes: "Back door on Elm Lane, before 7am",
  items: [
    { productId: BAGEL, quantity: 12 },
    { productId: RYE, quantity: 4 },
  ],
  skipDates: [],
  generatedThrough: d("2026-10-10"),
  version: 3,
  createdAt: "2026-09-01T00:00:00.000Z" as IsoInstant,
  updatedAt: "2026-09-01T00:00:00.000Z" as IsoInstant,
  ...overrides,
});

const input = (overrides: Partial<PlanGenerationInput> = {}): PlanGenerationInput => ({
  recurringOrder: recurring(),
  branch,
  customer: { id: "cafe" as CustomerId, name: "Corner Cup Cafe", email: "orders@cornercup.example.com", phone: "0370101120" },
  products: catalogue,
  branchProducts: new Map(),
  existingDates: new Set(),
  now: AFTER_CUTOFF,
  ...overrides,
});

function onlyCreate(plan: ReturnType<typeof planGeneration>) {
  if (plan.kind !== "planned") throw new Error(`expected a plan, got ${plan.kind}`);
  const created = plan.dates.filter((date) => date.kind === "create");
  if (created.length !== 1 || created[0].kind !== "create") throw new Error("expected one order to create");
  return created[0];
}

describe("a normal generated order (AC-R8)", () => {
  test("tomorrow's order: placed, pay at pickup, unpaid, the account's, priced now", () => {
    const plan = planGeneration(input());
    const created = onlyCreate(plan);
    expect(created.date).toBe(d("2026-10-11"));
    expect(created.order).toMatchObject({
      branchId: "northcote",
      customerId: "cafe",
      accountId: "cafe",
      contactName: "Corner Cup Cafe",
      contactEmail: "orders@cornercup.example.com",
      contactPhone: "0370101120",
      pickupDate: d("2026-10-11"),
      status: "placed",
      paymentMethod: "at_pickup",
      paymentStatus: "unpaid",
      recurringOrderId: "rec-1",
      notes: "Back door on Elm Lane, before 7am",
      generationNote: null,
      totalCents: 12 * 280 + 4 * 950,
      createdAt: AFTER_CUTOFF.toISOString(),
    });
    expect(created.order.items.map((item) => [item.productName, item.unitPriceCents, item.quantity])).toEqual([
      ["Plain bagel", 280, 12],
      ["Sourdough rye loaf", 950, 4],
    ]);
    expect(plan.kind === "planned" && plan.generatedThrough).toBe(d("2026-10-11"));
  });

  test("a price change applies to the next generated order (AC-P3)", () => {
    const dearer = new Map(catalogue).set(BAGEL, product(BAGEL, "Plain bagel", 300));
    const created = onlyCreate(planGeneration(input({ products: dearer })));
    expect(created.order.items[0].unitPriceCents).toBe(300);
    expect(created.order.totalCents).toBe(12 * 300 + 4 * 950);
  });

  test("the contact details come from the account as it is now", () => {
    const created = onlyCreate(
      planGeneration(input({ customer: { id: "cafe" as CustomerId, name: "Corner Cup", email: "new@cornercup.example.com", phone: "0491570158" } })),
    );
    expect([created.order.contactName, created.order.contactEmail, created.order.contactPhone]).toEqual([
      "Corner Cup",
      "new@cornercup.example.com",
      "0491570158",
    ]);
  });
});

describe("unavailable items (AC-R9, P2, P4, P5)", () => {
  test("sold out that day: left out, named in the note", () => {
    const rows = new Map([[RYE, row(RYE, { soldOutOn: d("2026-10-11") })]]);
    const created = onlyCreate(planGeneration(input({ branchProducts: rows })));
    expect(created.order.items.map((item) => item.productId)).toEqual([BAGEL]);
    expect(created.order.generationNote).toBe("Sourdough rye loaf ×4 skipped: sold out");
    expect(created.order.totalCents).toBe(12 * 280);
    expect(created.dropped).toEqual([{ productId: RYE, name: "Sourdough rye loaf", reason: "sold_out" }]);
  });

  test("sold out on another day doesn't count", () => {
    const rows = new Map([[RYE, row(RYE, { soldOutOn: d("2026-10-13") })]]);
    expect(onlyCreate(planGeneration(input({ branchProducts: rows }))).order.generationNote).toBeNull();
  });

  test("switched off at the branch, hidden everywhere, or gone: not on the menu", () => {
    const rows = new Map([[BAGEL, row(BAGEL, { isAvailable: false })]]);
    const hidden = new Map(catalogue).set(RYE, product(RYE, "Sourdough rye loaf", 950, false));
    expect(onlyCreate(planGeneration(input({ branchProducts: rows }))).order.generationNote).toBe(
      "Plain bagel ×12 skipped: not on the menu",
    );
    expect(onlyCreate(planGeneration(input({ products: hidden }))).order.generationNote).toBe(
      "Sourdough rye loaf ×4 skipped: not on the menu",
    );
    const gone = new Map(catalogue);
    gone.delete(RYE);
    expect(onlyCreate(planGeneration(input({ products: gone }))).order.generationNote).toBe(
      "sourdough-rye-loaf ×4 skipped: not on the menu",
    );
  });

  test("nothing left: the order is still made, empty and $0, with every item noted", () => {
    const rows = new Map([
      [BAGEL, row(BAGEL, { isAvailable: false })],
      [RYE, row(RYE, { soldOutOn: d("2026-10-11") })],
    ]);
    const created = onlyCreate(planGeneration(input({ branchProducts: rows })));
    expect(created.order.items).toEqual([]);
    expect(created.order.totalCents).toBe(0);
    expect(created.order.generationNote).toBe(
      "Plain bagel ×12 skipped: not on the menu; Sourdough rye loaf ×4 skipped: sold out",
    );
  });
});

describe("dates with no order", () => {
  test("a skipped date: no order, but the cursor moves", () => {
    const plan = planGeneration(input({ recurringOrder: recurring({ skipDates: [d("2026-10-11")] }) }));
    expect(plan).toEqual({
      kind: "planned",
      dates: [{ date: d("2026-10-11"), kind: "skip", reason: "skipped" }],
      generatedThrough: d("2026-10-11"),
    });
  });

  test("paused", () => {
    const plan = planGeneration(input({ recurringOrder: recurring({ status: "paused" }) }));
    expect(plan.kind === "planned" && plan.dates).toEqual([{ date: d("2026-10-11"), kind: "skip", reason: "paused" }]);
  });

  test("not a chosen day, after the end, before the start, or the branch is closed", () => {
    const cases: Partial<RecurringOrder>[] = [
      { daysOfWeek: [2] },
      { endsOn: d("2026-10-10") },
      { startsOn: d("2026-10-13") },
    ];
    for (const overrides of cases) {
      const plan = planGeneration(input({ recurringOrder: recurring(overrides) }));
      expect(plan.kind === "planned" && plan.dates[0]).toEqual({
        date: d("2026-10-11"),
        kind: "skip",
        reason: "not_scheduled",
      });
    }
    const sundaysClosed: BranchSchedule = { ...branch, closedDays: [0, 1] };
    const plan = planGeneration(input({ branch: sundaysClosed }));
    expect(plan.kind === "planned" && plan.dates[0].kind).toBe("skip");
  });

  test("a missing customer fails without moving the cursor", () => {
    expect(planGeneration(input({ customer: null }))).toEqual({ kind: "failed", reason: "customer_missing" });
  });

  test("a missing customer doesn't matter when nothing would be made", () => {
    const plan = planGeneration(input({ customer: null, recurringOrder: recurring({ status: "paused" }) }));
    expect(plan.kind).toBe("planned");
  });
});

describe("idempotency", () => {
  test("a rerun after the cursor moved has nothing due", () => {
    expect(planGeneration(input({ recurringOrder: recurring({ generatedThrough: d("2026-10-11") }) }))).toEqual({
      kind: "nothing_due",
    });
  });

  test("an order already at the date's ID counts as made, never as one to create", () => {
    const plan = planGeneration(input({ existingDates: new Set([d("2026-10-11")]) }));
    expect(plan).toEqual({
      kind: "planned",
      dates: [{ date: d("2026-10-11"), kind: "exists" }],
      generatedThrough: d("2026-10-11"),
    });
  });

  test("a missed day catches up today and tomorrow, each once", () => {
    const plan = planGeneration(input({ recurringOrder: recurring({ generatedThrough: d("2026-10-09") }) }));
    expect(plan.kind === "planned" && plan.dates.map((date) => [date.date, date.kind])).toEqual([
      [d("2026-10-10"), "create"],
      [d("2026-10-11"), "create"],
    ]);
  });

  test("before the cutoff, only today is due; it was generated yesterday", () => {
    const morning = new Date("2026-10-10T00:00:00Z"); // 11am AEDT
    expect(planGeneration(input({ now: morning }))).toEqual({ kind: "nothing_due" });
  });

  test("hasDueOrders: only orders that would make something open a transaction", () => {
    expect(hasDueOrders(recurring(), branch, AFTER_CUTOFF)).toBe(true);
    expect(hasDueOrders(recurring({ status: "paused" }), branch, AFTER_CUTOFF)).toBe(false);
    expect(hasDueOrders(recurring({ generatedThrough: d("2026-10-11") }), branch, AFTER_CUTOFF)).toBe(false);
    expect(hasDueOrders(recurring({ skipDates: [d("2026-10-11")] as IsoDate[] }), branch, AFTER_CUTOFF)).toBe(false);
  });
});
