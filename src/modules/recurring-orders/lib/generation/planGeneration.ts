import { priceLine, totalOf } from "@/modules/orders/lib/priceOrder";
import type {
  BranchProduct,
  BranchSchedule,
  Customer,
  IsoDate,
  IsoInstant,
  Order,
  OrderItem,
  Product,
  ProductId,
  RecurringOrder,
} from "@/shared/domain";
import type { UnavailableItem } from "@/shared/lib/api/apiError";
import {
  dueDates,
  isScheduledOn,
  lockedThrough,
  wouldGenerate,
} from "@/shared/utils/pickup-dates";
import { recurringContent } from "../../content/recurringContent";

const noteContent = recurringContent.generationNote;

// What generation does for one recurring order (spec 8, AC-R8, R9). Pure:
// the caller reads Firestore inside a transaction and writes what this says.
//
// Two things keep it idempotent. The cursor (`generatedThrough`) moves to the
// last locked date once every due date has been looked at, so a rerun has no
// due dates. And an order already at a date's deterministic ID counts as
// made, never as one to create.

/** A generated order before its ID and number exist (the caller adds both). */
export type GeneratedOrderDraft = Omit<Order, "id" | "orderNumber">;

export type SkipReason =
  /** Not one of its weekdays, outside its start and end, or the branch is closed. */
  | "not_scheduled"
  | "skipped"
  | "paused";

export type DatePlan =
  | { date: IsoDate; kind: "create"; order: GeneratedOrderDraft; dropped: UnavailableItem[] }
  | { date: IsoDate; kind: "exists" }
  | { date: IsoDate; kind: "skip"; reason: SkipReason };

export type GenerationPlan =
  /** Nothing is due: no reads beyond these, no writes. */
  | { kind: "nothing_due" }
  | { kind: "planned"; dates: DatePlan[]; generatedThrough: IsoDate }
  /** Something it needs is missing. Nothing is written and the cursor stays, so a fix is picked up next run. */
  | { kind: "failed"; reason: "customer_missing" };

export interface PlanGenerationInput {
  recurringOrder: RecurringOrder;
  branch: BranchSchedule;
  /** The recurring order's customer, as stored now, or null if missing. */
  customer: Pick<Customer, "id" | "name" | "email" | "phone"> | null;
  /** Current products by ID; a missing entry is a product that no longer exists. */
  products: ReadonlyMap<ProductId, Product>;
  /** The branch's rows by product ID; a missing entry means available. */
  branchProducts: ReadonlyMap<ProductId, BranchProduct>;
  /** Due dates that already have an order at their deterministic ID. */
  existingDates: ReadonlySet<IsoDate>;
  now: Date;
}

/** "Sourdough rye loaf ×4 skipped: sold out; Fruit loaf ×2 skipped: not on the menu", or null. */
export function generationNote(dropped: readonly UnavailableItem[], quantities: ReadonlyMap<ProductId, number>): string | null {
  if (dropped.length === 0) return null;
  return dropped
    .map((item) =>
      noteContent.line(item.name, quantities.get(item.productId) ?? 0, noteContent.reason[item.reason]),
    )
    .join(noteContent.separator);
}

function skipReason(recurringOrder: RecurringOrder, branch: BranchSchedule, date: IsoDate): SkipReason {
  if (!isScheduledOn(recurringOrder, branch, date)) return "not_scheduled";
  if (recurringOrder.status === "paused") return "paused";
  return "skipped";
}

function draftOrder(
  { recurringOrder, customer, products, branchProducts, now }: PlanGenerationInput & { customer: NonNullable<PlanGenerationInput["customer"]> },
  date: IsoDate,
): { order: GeneratedOrderDraft; dropped: UnavailableItem[] } {
  const items: OrderItem[] = [];
  const dropped: UnavailableItem[] = [];
  for (const requested of recurringOrder.items) {
    const line = priceLine(requested, date, products, branchProducts);
    if (line.ok) items.push(line.item);
    else dropped.push(line.unavailable);
  }
  const quantities = new Map(recurringOrder.items.map((item) => [item.productId, item.quantity]));

  const order: GeneratedOrderDraft = {
    branchId: recurringOrder.branchId,
    customerId: customer.id,
    // The account's own order: it shows in C9's history (AC-R10).
    accountId: customer.id,
    // From the account as it is now (AC-R8).
    contactName: customer.name,
    contactPhone: customer.phone,
    contactEmail: customer.email,
    pickupDate: date,
    status: "placed",
    notes: recurringOrder.notes,
    items,
    totalCents: totalOf(items),
    // Always pay at pickup (spec 6, 8): no payment provider is involved.
    paymentMethod: "at_pickup",
    paymentStatus: "unpaid",
    paymentRef: null,
    processedStripeEventIds: [],
    checkoutSessionId: null,
    paymentExpiresAt: null,
    recurringOrderId: recurringOrder.id,
    generationNote: generationNote(dropped, quantities),
    cancellationReason: null,
    cancellationNote: null,
    collectUndo: null,
    createdAt: now.toISOString() as IsoInstant,
    paidAt: null,
    refundedAt: null,
    readyAt: null,
    collectedAt: null,
    cancelledAt: null,
  };
  return { order, dropped };
}

/**
 * Every due date of one recurring order: an order to create (with any items
 * the branch can't sell that day left out and named in the note, even if
 * that leaves none, AC-R9), one that already exists, or a date with no
 * order (skipped, paused, closed or outside its dates). Then the new cursor.
 */
export function planGeneration(input: PlanGenerationInput): GenerationPlan {
  const { recurringOrder, branch, customer, existingDates, now } = input;
  const dates = dueDates(recurringOrder, branch, now);
  if (dates.length === 0) return { kind: "nothing_due" };

  const plans: DatePlan[] = [];
  for (const date of dates) {
    if (existingDates.has(date)) {
      plans.push({ date, kind: "exists" });
    } else if (!wouldGenerate(recurringOrder, branch, date)) {
      plans.push({ date, kind: "skip", reason: skipReason(recurringOrder, branch, date) });
    } else if (!customer) {
      return { kind: "failed", reason: "customer_missing" };
    } else {
      plans.push({ date, kind: "create", ...draftOrder({ ...input, customer }, date) });
    }
  }
  return { kind: "planned", dates: plans, generatedThrough: lockedThrough(branch, now) };
}

/** Whether any due date would get a new order: the branch run only opens a transaction for these. */
export function hasDueOrders(recurringOrder: RecurringOrder, branch: BranchSchedule, now: Date): boolean {
  return dueDates(recurringOrder, branch, now).some((date) => wouldGenerate(recurringOrder, branch, date));
}
