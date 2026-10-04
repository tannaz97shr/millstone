import { describe, expect, test } from "bun:test";
import type { BranchId, IsoDate, IsoInstant, OrderId } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { type OrderAction, UNDO_SERVER_WINDOW_MS } from "./orderActionSchema";
import { applyChanges, planOrderAction, type VisibleOrder } from "./planOrderAction";

const NOW = new Date("2026-10-04T22:00:00.000Z");
const at = NOW.toISOString();

function order(overrides: Partial<VisibleOrder> = {}): VisibleOrder {
  return {
    id: "o1" as OrderId,
    orderNumber: "MS-1043",
    branchId: "northcote" as BranchId,
    customerId: null,
    contactName: "Sam Carter",
    contactPhone: "0491570156",
    contactEmail: "sam.carter@example.com",
    pickupDate: "2026-10-05" as IsoDate,
    status: "placed",
    notes: "",
    items: [],
    totalCents: 0,
    paymentMethod: "online",
    paymentStatus: "paid",
    paymentRef: null,
    processedStripeEventIds: [],
    recurringOrderId: null,
    generationNote: null,
    cancellationReason: null,
    cancellationNote: null,
    collectUndo: null,
    createdAt: "2026-10-03T09:00:00.000Z" as IsoInstant,
    paidAt: null,
    refundedAt: null,
    readyAt: null,
    collectedAt: null,
    cancelledAt: null,
    ...overrides,
  };
}

function refusal(run: () => unknown): { status: number; code: string; currentStatus?: string } {
  try {
    run();
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: error.status, code: error.code, currentStatus: error.details.currentStatus };
    }
    throw error;
  }
  throw new Error("expected a refusal");
}

const plan = (o: VisibleOrder, action: OrderAction, now = NOW) => planOrderAction(o, action, now);

describe("ready (AC-A6)", () => {
  test("placed → ready with readyAt", () => {
    expect(plan(order(), { action: "ready", expectedStatus: "placed" }).changes).toEqual({
      status: "ready",
      readyAt: at,
    });
  });

  test("a second Ready from a stale screen is 'already changed'", () => {
    expect(refusal(() => plan(order({ status: "ready" }), { action: "ready", expectedStatus: "placed" }))).toEqual({
      status: 409,
      code: "order_changed",
      currentStatus: "ready",
    });
  });

  test("not allowed on a ready, collected or cancelled order", () => {
    for (const status of ["ready", "collected", "cancelled"] as const) {
      expect(refusal(() => plan(order({ status }), { action: "ready", expectedStatus: status })).code).toBe(
        "not_allowed",
      );
    }
  });
});

describe("collect (AC-A7)", () => {
  test("paid, from placed or ready: collected with an Undo window", () => {
    for (const status of ["placed", "ready"] as const) {
      const result = plan(order({ status }), { action: "collect", expectedStatus: status, paymentConfirmed: false });
      const until = new Date(NOW.getTime() + UNDO_SERVER_WINDOW_MS).toISOString();
      expect(result.changes).toEqual({
        status: "collected",
        collectedAt: at,
        collectUndo: { previousStatus: status, until },
      });
      expect(result.undoUntil).toBe(until as IsoInstant);
    }
  });

  test("unpaid with Yes, paid: paid, paidAt and collected in one write, no Undo", () => {
    const result = plan(order({ status: "ready", paymentMethod: "at_pickup", paymentStatus: "unpaid" }), {
      action: "collect",
      expectedStatus: "ready",
      paymentConfirmed: true,
    });
    expect(result.changes).toEqual({
      status: "collected",
      collectedAt: at,
      paymentStatus: "paid",
      paidAt: at,
      collectUndo: null,
    });
    expect(result.undoUntil).toBeNull();
  });

  test("unpaid without confirming payment is refused", () => {
    const o = order({ paymentMethod: "at_pickup", paymentStatus: "unpaid" });
    expect(refusal(() => plan(o, { action: "collect", expectedStatus: "placed", paymentConfirmed: false })).code).toBe(
      "payment_unconfirmed",
    );
  });

  test("a second Collected is 'already changed'; final orders are read-only", () => {
    const collected = order({ status: "collected" });
    expect(
      refusal(() => plan(collected, { action: "collect", expectedStatus: "ready", paymentConfirmed: false })).code,
    ).toBe("order_changed");
    expect(
      refusal(() => plan(collected, { action: "collect", expectedStatus: "collected", paymentConfirmed: false })).code,
    ).toBe("not_allowed");
  });
});

describe("undo_collect", () => {
  const collectedFrom = (previousStatus: "placed" | "ready", untilMs: number) =>
    order({
      status: "collected",
      readyAt: previousStatus === "ready" ? ("2026-10-04T21:00:00.000Z" as IsoInstant) : null,
      collectedAt: at as IsoInstant,
      collectUndo: { previousStatus, until: new Date(NOW.getTime() + untilMs).toISOString() as IsoInstant },
    });

  test("inside the window: back to the previous status, collectedAt cleared, readyAt kept", () => {
    for (const previous of ["placed", "ready"] as const) {
      const o = collectedFrom(previous, 1_000);
      const result = plan(o, { action: "undo_collect" });
      expect(result.changes).toEqual({ status: previous, collectedAt: null, collectUndo: null });
      expect(applyChanges(o, result.changes).readyAt).toBe(o.readyAt);
    }
  });

  test("on the last millisecond it still works; one after, it's too late", () => {
    expect(plan(collectedFrom("ready", 0), { action: "undo_collect" }).changes.status).toBe("ready");
    expect(refusal(() => plan(collectedFrom("ready", -1), { action: "undo_collect" })).code).toBe("undo_expired");
  });

  test("an order collected through the payment dialog has no Undo", () => {
    expect(refusal(() => plan(order({ status: "collected" }), { action: "undo_collect" })).code).toBe("undo_expired");
  });

  test("already undone on another screen", () => {
    expect(refusal(() => plan(order({ status: "ready" }), { action: "undo_collect" }))).toEqual({
      status: 409,
      code: "order_changed",
      currentStatus: "ready",
    });
  });
});

describe("cancel (AC-A8)", () => {
  test("placed or ready, with a reason", () => {
    const result = plan(order({ status: "ready" }), {
      action: "cancel",
      expectedStatus: "ready",
      reason: "not_collected",
    });
    expect(result.changes).toEqual({
      status: "cancelled",
      cancelledAt: at,
      cancellationReason: "not_collected",
      cancellationNote: null,
      collectUndo: null,
    });
  });

  test("other keeps its note; other reasons drop a stray note", () => {
    const other = plan(order(), { action: "cancel", expectedStatus: "placed", reason: "other", note: "Wrong day" });
    expect(other.changes.cancellationNote).toBe("Wrong day");
    const request = plan(order(), {
      action: "cancel",
      expectedStatus: "placed",
      reason: "customer_request",
      note: "ignored",
    });
    expect(request.changes.cancellationNote).toBeNull();
  });

  test("other without a note is refused", () => {
    expect(refusal(() => plan(order(), { action: "cancel", expectedStatus: "placed", reason: "other" })).status).toBe(
      400,
    );
  });

  test("a double cancel is 'already changed'; final orders can't be cancelled", () => {
    const cancelled = order({ status: "cancelled", cancellationReason: "customer_request" });
    expect(
      refusal(() => plan(cancelled, { action: "cancel", expectedStatus: "placed", reason: "customer_request" })).code,
    ).toBe("order_changed");
    expect(
      refusal(() =>
        plan(order({ status: "collected" }), {
          action: "cancel",
          expectedStatus: "collected",
          reason: "customer_request",
        }),
      ).code,
    ).toBe("not_allowed");
  });
});

describe("mark_refunded (AC-A9)", () => {
  test("a cancelled order paid online", () => {
    expect(plan(order({ status: "cancelled" }), { action: "mark_refunded" }).changes).toEqual({
      paymentStatus: "refunded",
      refundedAt: at,
    });
  });

  test("twice is 'already changed'", () => {
    expect(
      refusal(() => plan(order({ status: "cancelled", paymentStatus: "refunded" }), { action: "mark_refunded" })).code,
    ).toBe("order_changed");
  });

  test("not on open, collected, or never-paid orders", () => {
    for (const o of [
      order({ status: "placed" }),
      order({ status: "collected" }),
      order({ status: "cancelled", paymentMethod: "at_pickup", paymentStatus: "unpaid" }),
    ]) {
      expect(refusal(() => plan(o, { action: "mark_refunded" })).code).toBe("not_allowed");
    }
  });
});
