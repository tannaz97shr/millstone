import { describe, expect, test } from "bun:test";
import type {
  BranchId,
  BranchSchedule,
  CustomerId,
  IsoInstant,
  ProductId,
  RecurringOrder,
  RecurringOrderId,
  TimeOfDay,
} from "@/shared/domain";
import { toIsoDate } from "@/shared/utils/pickup-dates";
import { checkFields, hasStarted, planAction, planEdit, type ChangePlan } from "./planRecurringChange";
import type { RecurringActionRequest, UpdateRecurringRequest } from "./recurringSchemas";

// Wed 7 Oct 2026, 1pm AEDT: Wed is locked, Thu 8 Oct is the first changeable day.
const BEFORE_CUTOFF = new Date("2026-10-07T02:00:00Z");
// Wed 7 Oct 2026, 3pm AEDT: Thu 8 Oct is locked too.
const AFTER_CUTOFF = new Date("2026-10-07T04:00:00Z");
const d = toIsoDate;

const branch: BranchSchedule = { orderCutoffTime: "14:00" as TimeOfDay, closedDays: [1] };
const BAGEL = "plain-bagel" as ProductId;
const RYE = "sourdough-rye-loaf" as ProductId;
const FRUIT = "fruit-loaf" as ProductId;

const recurring = (overrides: Partial<RecurringOrder> = {}): RecurringOrder => ({
  id: "rec-1" as RecurringOrderId,
  customerId: "cafe" as CustomerId,
  branchId: "northcote" as BranchId,
  daysOfWeek: [2, 4, 6], // Tue, Thu, Sat
  status: "active",
  startsOn: d("2026-09-01"),
  endsOn: null,
  notes: "",
  items: [{ productId: BAGEL, quantity: 12 }],
  skipDates: [],
  generatedThrough: d("2026-10-07"),
  version: 4,
  createdAt: "2026-09-01T00:00:00.000Z" as IsoInstant,
  updatedAt: "2026-09-01T00:00:00.000Z" as IsoInstant,
  ...overrides,
});

const action = (request: Partial<RecurringActionRequest> & Pick<RecurringActionRequest, "action">, rec = recurring(), now = BEFORE_CUTOFF) =>
  planAction({ recurringOrder: rec, branch, request: { expectedVersion: 4, ...request } as RecurringActionRequest, now });

const refusedCode = (plan: ChangePlan) => (plan.kind === "refused" ? plan.code : "change");
const changes = (plan: ChangePlan) => {
  if (plan.kind !== "change") throw new Error(`refused: ${plan.code}`);
  return plan.changes;
};

describe("versions and ended orders", () => {
  test("a stale version is refused: changed on another screen", () => {
    const plan = planAction({ recurringOrder: recurring(), branch, request: { action: "pause", expectedVersion: 3 }, now: BEFORE_CUTOFF });
    expect(plan).toMatchObject({ kind: "refused", status: 409, code: "recurring_changed" });
  });

  test("an ended order can't be changed", () => {
    expect(refusedCode(action({ action: "resume" }, recurring({ endsOn: d("2026-10-06"), status: "paused" })))).toBe("not_allowed");
  });
});

describe("pause and resume (AC-R6)", () => {
  test("pause, then resume", () => {
    expect(changes(action({ action: "pause" })).status).toBe("paused");
    expect(changes(action({ action: "resume" }, recurring({ status: "paused" }))).status).toBe("active");
  });

  test("pausing a paused order, or resuming an active one, is refused", () => {
    expect(refusedCode(action({ action: "pause" }, recurring({ status: "paused" })))).toBe("not_allowed");
    expect(refusedCode(action({ action: "resume" }))).toBe("not_allowed");
  });
});

describe("skip and undo (AC-R5)", () => {
  test("a pickup day before its cutoff can be skipped", () => {
    expect(changes(action({ action: "skip", date: d("2026-10-08") })).skipDates).toEqual([d("2026-10-08")]);
  });

  test("after its cutoff it's locked: call the branch", () => {
    expect(refusedCode(action({ action: "skip", date: d("2026-10-08") }, recurring(), AFTER_CUTOFF))).toBe("date_locked");
  });

  test("a day that isn't one of its pickups can't be skipped", () => {
    expect(refusedCode(action({ action: "skip", date: d("2026-10-09") }))).toBe("not_scheduled"); // Fri
    expect(refusedCode(action({ action: "skip", date: d("2026-10-12") }, recurring({ daysOfWeek: [1, 2] })))).toBe("not_scheduled"); // closed Mon
  });

  test("paused orders have nothing to skip", () => {
    expect(refusedCode(action({ action: "skip", date: d("2026-10-08") }, recurring({ status: "paused" })))).toBe("not_allowed");
  });

  test("undo before the cutoff; after it the skip stands", () => {
    const skipped = recurring({ skipDates: [d("2026-10-08")] });
    expect(changes(action({ action: "unskip", date: d("2026-10-08") }, skipped)).skipDates).toEqual([]);
    expect(refusedCode(action({ action: "unskip", date: d("2026-10-08") }, skipped, AFTER_CUTOFF))).toBe("date_locked");
    expect(refusedCode(action({ action: "unskip", date: d("2026-10-10") }, skipped))).toBe("not_scheduled");
  });

  test("past skips are dropped on save, and duplicates collapse", () => {
    const old = recurring({ skipDates: [d("2026-09-29"), d("2026-10-10")] });
    expect(changes(action({ action: "skip", date: d("2026-10-10") }, old)).skipDates).toEqual([d("2026-10-10")]);
  });
});

describe("end (AC-R7)", () => {
  test("Stop now ends on the last locked date, so an order already made stands", () => {
    expect(changes(action({ action: "end_now" })).endsOn).toBe(d("2026-10-07"));
    expect(changes(action({ action: "end_now" }, recurring(), AFTER_CUTOFF)).endsOn).toBe(d("2026-10-08"));
  });

  test("After a pickup day: one of its own changeable, unskipped days", () => {
    expect(changes(action({ action: "end_after", date: d("2026-10-10") })).endsOn).toBe(d("2026-10-10"));
    expect(refusedCode(action({ action: "end_after", date: d("2026-10-09") }))).toBe("not_scheduled");
    expect(refusedCode(action({ action: "end_after", date: d("2026-10-10") }, recurring({ skipDates: [d("2026-10-10")] })))).toBe("not_scheduled");
    expect(refusedCode(action({ action: "end_after", date: d("2026-10-08") }, recurring(), AFTER_CUTOFF))).toBe("date_locked");
  });

  test("an end can move later than the current one", () => {
    const ending = recurring({ endsOn: d("2026-10-10") });
    expect(changes(action({ action: "end_after", date: d("2026-10-17") }, ending)).endsOn).toBe(d("2026-10-17"));
  });
});

describe("edit (AC-R4)", () => {
  const onMenu = new Set([BAGEL, RYE]);
  const names = new Map([[BAGEL, "Plain bagel"], [RYE, "Sourdough rye loaf"], [FRUIT, "Fruit loaf"]]);
  const request = (overrides: Partial<UpdateRecurringRequest> = {}): UpdateRecurringRequest => ({
    daysOfWeek: [2, 4, 6],
    items: [{ productId: BAGEL, quantity: 10 }],
    startsOn: d("2026-09-01"),
    endsOn: null,
    notes: "Back door",
    expectedVersion: 4,
    ...overrides,
  });
  const edit = (overrides: Partial<UpdateRecurringRequest> = {}, rec = recurring(), now = BEFORE_CUTOFF) =>
    planEdit({ recurringOrder: rec, branch, request: request(overrides), onMenu, names, now });

  test("days, items and notes change; the start stays once started", () => {
    expect(changes(edit({ startsOn: d("2026-12-01") }))).toEqual({
      daysOfWeek: [2, 4, 6],
      items: [{ productId: BAGEL, quantity: 10 }],
      startsOn: d("2026-09-01"),
      endsOn: null,
      notes: "Back door",
      skipDates: [],
    });
  });

  test("before its first pickup, the start can move, but not before the earliest pickup", () => {
    const later = recurring({ startsOn: d("2026-10-20") });
    expect(changes(edit({ startsOn: d("2026-10-22") }, later)).startsOn).toBe(d("2026-10-22"));
    expect(edit({ startsOn: d("2026-10-07") }, later)).toMatchObject({ code: "start_too_early", earliest: d("2026-10-08") });
  });

  test("a closed weekday is refused", () => {
    expect(refusedCode(edit({ daysOfWeek: [1, 2] }))).toBe("closed_day");
  });

  test("a new item must be on the menu; one already in may stay after leaving it (AC-P2)", () => {
    expect(edit({ items: [{ productId: FRUIT, quantity: 1 }] })).toMatchObject({
      code: "items_unavailable",
      items: [{ productId: FRUIT, name: "Fruit loaf", reason: "not_available" }],
    });
    const withFruit = recurring({ items: [{ productId: FRUIT, quantity: 2 }] });
    expect(changes(edit({ items: [{ productId: FRUIT, quantity: 3 }] }, withFruit)).items).toEqual([{ productId: FRUIT, quantity: 3 }]);
  });

  test("skips on days no longer chosen are dropped", () => {
    const skipped = recurring({ skipDates: [d("2026-10-08"), d("2026-10-10")] });
    expect(changes(edit({ daysOfWeek: [6] }, skipped)).skipDates).toEqual([d("2026-10-10")]);
  });

  test("a new end date must be one of its changeable pickup days; an unchanged one isn't checked", () => {
    expect(changes(edit({ endsOn: d("2026-10-17") })).endsOn).toBe(d("2026-10-17"));
    expect(refusedCode(edit({ endsOn: d("2026-10-16") }))).toBe("not_scheduled");
    expect(refusedCode(edit({ endsOn: d("2026-10-08") }, recurring(), AFTER_CUTOFF))).toBe("date_locked");
    const ending = recurring({ endsOn: d("2026-10-10"), daysOfWeek: [2, 4, 6] });
    expect(changes(edit({ endsOn: d("2026-10-10"), daysOfWeek: [2, 4] }, ending)).endsOn).toBe(d("2026-10-10"));
  });

  test("an order that has ended can't be edited", () => {
    const ended = recurring({ endsOn: d("2026-10-08") });
    expect(refusedCode(edit({ endsOn: d("2026-10-08") }, ended, AFTER_CUTOFF))).toBe("not_allowed");
  });
});

describe("checkFields for a new order (AC-R2)", () => {
  const base = {
    branch,
    daysOfWeek: [2, 4] as RecurringOrder["daysOfWeek"],
    items: [{ productId: BAGEL, quantity: 1 }],
    startsOn: d("2026-10-08"),
    endsOn: null,
    onMenu: new Set([BAGEL]),
    names: new Map<ProductId, string>(),
    alreadyIn: new Set<ProductId>(),
    checkStart: true,
    checkEnd: true,
    now: BEFORE_CUTOFF,
  };

  test("the earliest start follows checkout's cutoff rule (AC-C3)", () => {
    expect(checkFields(base)).toBeNull();
    expect(checkFields({ ...base, now: AFTER_CUTOFF })).toMatchObject({ code: "start_too_early", earliest: d("2026-10-09") });
  });

  test("a product that isn't on the branch's menu can't be added", () => {
    expect(checkFields({ ...base, onMenu: new Set() })).toMatchObject({ code: "items_unavailable" });
  });

  test("hasStarted: once the start date is locked", () => {
    expect(hasStarted({ startsOn: d("2026-10-08") }, branch, BEFORE_CUTOFF)).toBe(false);
    expect(hasStarted({ startsOn: d("2026-10-08") }, branch, AFTER_CUTOFF)).toBe(true);
  });
});
