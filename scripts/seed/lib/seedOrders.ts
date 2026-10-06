import { FIRST_ORDER_NUMBER, formatOrderNumber, generatedOrderId, orderCounterRef, orderCounterToDoc } from "@/modules/orders/lib/orderIds";
import { orderCounterDocSchema } from "@/modules/orders/lib/orderSchema";
import { paymentExpiresAtFor } from "@/modules/orders/lib/payment/paymentWindow";
import { orderToDoc } from "@/modules/orders/lib/toOrder";
import { recurringOrderToDoc } from "@/modules/recurring-orders/lib/toRecurringOrder";
import type {
  Branch,
  BranchId,
  CustomerId,
  IsoDate,
  IsoInstant,
  Order,
  OrderId,
  OrderItem,
  ProductId,
  RecurringOrderId,
  Weekday,
} from "@/shared/domain";
import { getDb } from "@/shared/lib/firebase/admin";
import { COLLECTIONS, ordersRef, recurringOrdersRef } from "@/shared/lib/firebase/collections";
import { parseDoc } from "@/shared/lib/firebase/parseDoc";
import {
  addDays,
  isClosedOn,
  melbourneDateOf,
  melbourneWallTimeToInstant,
  toTimeOfDay,
} from "@/shared/utils/pickup-dates";
import { seedBranches } from "../data/branches";
import { SEED_ORDER_NUMBERS, type SeedDay, type SeedOrder, seedOrders, seedRecurring, type SeedStamp } from "../data/orders";
import { seedProducts } from "../data/products";
import { upsertDoc, type WriteTally } from "./upsert";

// Seeds the admin's orders (data/orders.ts) on days relative to the clock.
// Doc IDs are fixed ("seed-ms-1042"), so a rerun updates the same docs and
// puts them back to their seeded state; a same-day rerun changes nothing.

const SEED_ID_PREFIX = "seed-";
const MAX_SCAN_DAYS = 14;

export const seedOrderId = (number: number) => `${SEED_ID_PREFIX}ms-${number}` as OrderId;

type SeedDays = Record<SeedDay, IsoDate>;

function openDayFrom(branch: Branch, start: IsoDate, step: 1 | -1): IsoDate {
  let date = start;
  for (let i = 0; i < MAX_SCAN_DAYS; i += 1) {
    if (!isClosedOn(branch, date)) return date;
    date = addDays(date, step);
  }
  throw new Error(`Branch ${branch.id} has no open day near ${start}`);
}

/** D0 (today, or the next open day), D1 and D2 after it, P1 before it. */
export function seedDaysFor(branch: Branch, now: Date): SeedDays {
  const d0 = openDayFrom(branch, melbourneDateOf(now), 1);
  const d1 = openDayFrom(branch, addDays(d0, 1), 1);
  const d2 = openDayFrom(branch, addDays(d1, 1), 1);
  const p1 = openDayFrom(branch, addDays(d0, -1), -1);
  return { P1: p1, D0: d0, D1: d1, D2: d2 };
}

const instantAt = (days: SeedDays, stamp: SeedStamp): IsoInstant =>
  melbourneWallTimeToInstant(addDays(days[stamp.day], stamp.daysFrom), toTimeOfDay(stamp.time)).toISOString() as IsoInstant;

const optionalInstant = (days: SeedDays, stamp: SeedStamp | undefined) => (stamp ? instantAt(days, stamp) : null);

const PRODUCTS = new Map(seedProducts.map((product) => [product.id, product]));

function priceItems(items: [number, ProductId][]): OrderItem[] {
  return items.map(([quantity, productId]) => {
    const product = PRODUCTS.get(productId);
    if (!product) throw new Error(`Seed order uses unknown product "${productId}"`);
    return {
      productId,
      productName: product.name,
      unitPriceCents: product.priceCents,
      quantity,
      lineTotalCents: product.priceCents * quantity,
    };
  });
}

interface SeedContext {
  daysByBranch: Map<BranchId, SeedDays>;
  customers: Map<string, { id: CustomerId; name: string; email: string; phone: string }>;
}

function customerFor(context: SeedContext, email: string) {
  const customer = context.customers.get(email);
  if (!customer) throw new Error(`Seed order names unknown customer ${email}`);
  return customer;
}

function daysFor(context: SeedContext, branchId: BranchId): SeedDays {
  const days = context.daysByBranch.get(branchId);
  if (!days) throw new Error(`No seed days for branch ${branchId}`);
  return days;
}

function buildOrder(spec: SeedOrder, context: SeedContext): Omit<Order, "id"> {
  const days = daysFor(context, spec.branchId);
  const customer = customerFor(context, spec.email);
  const items = priceItems(spec.items);
  const createdAt = instantAt(days, spec.placedAt);
  return {
    orderNumber: formatOrderNumber(spec.number),
    branchId: spec.branchId,
    customerId: customer.id,
    contactName: customer.name,
    contactPhone: customer.phone,
    contactEmail: customer.email,
    pickupDate: days[spec.pickup],
    status: spec.status,
    notes: spec.notes ?? "",
    items,
    totalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0),
    paymentMethod: spec.paymentMethod,
    paymentStatus: spec.paymentStatus,
    paymentRef: spec.paymentRef ?? null,
    processedStripeEventIds: [],
    // No checkout page: seed orders were never sent to Stripe. MS-1028 stays
    // awaiting_payment for good: its ID isn't a checkout key, so neither C7
    // nor checkout ever reads it to expire it lazily. Staff never see it.
    checkoutSessionId: null,
    paymentExpiresAt: spec.paymentMethod === "online" ? paymentExpiresAtFor(new Date(createdAt)) : null,
    recurringOrderId: null,
    generationNote: null,
    cancellationReason: spec.cancellationReason ?? null,
    cancellationNote: spec.cancellationNote ?? null,
    collectUndo: null,
    createdAt,
    paidAt: optionalInstant(days, spec.paidAt),
    refundedAt: optionalInstant(days, spec.refundedAt),
    readyAt: optionalInstant(days, spec.readyAt),
    collectedAt: optionalInstant(days, spec.collectedAt),
    cancelledAt: optionalInstant(days, spec.cancelledAt),
  };
}

/** Old generated orders from a seed run on an earlier day; they'd hold MS-1042 twice. */
async function removeStaleGenerated(currentId: OrderId, tally: WriteTally): Promise<void> {
  const snapshot = await ordersRef().where("recurringOrderId", "==", seedRecurring.id).get();
  for (const doc of snapshot.docs) {
    if (doc.id === currentId) continue;
    await doc.ref.delete();
    tally.record(`${COLLECTIONS.orders} (stale generated, deleted)`, "updated");
  }
}

/** Seed numbers belong to seed docs only; anything else holding one is a clash. */
async function assertNumbersFree(): Promise<void> {
  const numbers: string[] = [];
  for (let n = SEED_ORDER_NUMBERS.first; n <= SEED_ORDER_NUMBERS.last; n += 1) numbers.push(formatOrderNumber(n));
  const snapshot = await ordersRef().where("orderNumber", "in", numbers).get();
  const clashes = snapshot.docs.filter((doc) => !doc.id.startsWith(SEED_ID_PREFIX));
  if (clashes.length > 0) {
    const list = clashes.map((doc) => `${doc.id} (${String(doc.get("orderNumber"))})`).join(", ");
    throw new Error(
      `Refusing to seed orders: ${list} already use seed order numbers. Run "bun run seed --reset" on the emulator.`,
    );
  }
}

/** Moves the counter past the seed's numbers, so checkout never hands one out again. */
async function bumpCounter(tally: WriteTally): Promise<void> {
  const minimum = SEED_ORDER_NUMBERS.last + 1;
  const outcome = await getDb().runTransaction(async (tx) => {
    const snapshot = await tx.get(orderCounterRef());
    const next = snapshot.exists ? parseDoc(orderCounterDocSchema, snapshot).next : FIRST_ORDER_NUMBER;
    if (next >= minimum) return "unchanged" as const;
    tx.set(orderCounterRef(), orderCounterToDoc(minimum));
    return "updated" as const;
  });
  tally.record(COLLECTIONS.counters, outcome);
}

export async function seedOrdersAndRecurring(
  now: Date,
  customers: SeedContext["customers"],
  tally: WriteTally,
): Promise<void> {
  const daysByBranch = new Map(seedBranches.map((branch) => [branch.id, seedDaysFor(branch, now)]));
  const context: SeedContext = { daysByBranch, customers };

  // The cafe's recurring order.
  const cafe = customerFor(context, seedRecurring.email);
  const cafeDays = daysFor(context, seedRecurring.branchId);
  const recurringId = seedRecurring.id as RecurringOrderId;
  tally.record(
    COLLECTIONS.recurringOrders,
    await upsertDoc(
      recurringOrdersRef().doc(recurringId),
      recurringOrderToDoc({
        customerId: cafe.id,
        branchId: seedRecurring.branchId,
        daysOfWeek: [...seedRecurring.daysOfWeek] as Weekday[],
        status: "active",
        startsOn: addDays(cafeDays.D0, -14),
        endsOn: null,
        notes: seedRecurring.notes,
        items: seedRecurring.items.map(([quantity, productId]) => ({ productId, quantity })),
        skipDates: [],
        createdAt: instantAt(cafeDays, { day: "D0", daysFrom: -15, time: "10:00" }),
      }),
    ),
  );

  const generatedId = generatedOrderId(recurringId, cafeDays.D0);
  await removeStaleGenerated(generatedId, tally);
  await assertNumbersFree();

  for (const spec of seedOrders) {
    tally.record(COLLECTIONS.orders, await upsertDoc(ordersRef().doc(seedOrderId(spec.number)), orderToDoc(buildOrder(spec, context))));
  }

  // MS-1042: generated at the cutoff the day before, with the rye left out.
  const { generated } = seedRecurring;
  const generatedOrder: Omit<Order, "id"> = {
    ...buildOrder(
      {
        number: generated.number,
        branchId: seedRecurring.branchId,
        pickup: "D0",
        status: "placed",
        paymentMethod: "at_pickup",
        paymentStatus: "unpaid",
        email: seedRecurring.email,
        items: seedRecurring.items.filter(([, productId]) => productId !== generated.skipped),
        notes: seedRecurring.notes,
        placedAt: generated.placedAt,
      },
      context,
    ),
    recurringOrderId: recurringId,
    generationNote: generated.generationNote,
  };
  tally.record(COLLECTIONS.orders, await upsertDoc(ordersRef().doc(generatedId), orderToDoc(generatedOrder)));

  await bumpCounter(tally);
}

/** Seed docs only: for the summary. */
export const isSeedOrderId = (id: string) => id.startsWith(SEED_ID_PREFIX);
