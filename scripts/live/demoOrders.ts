import type { DocumentReference, DocumentSnapshot, Transaction } from "firebase-admin/firestore";
import { z } from "zod";
import { applyChanges, planOrderAction } from "@/modules/admin-orders/lib/planOrderAction";
import { orderActionSchema, type OrderActionRequest } from "@/modules/admin-orders/lib/orderActionSchema";
import { isVisibleStatus } from "@/modules/admin-orders/lib/paymentLabel";
import { toBranch } from "@/modules/branches/lib/toBranch";
import { toBranchProduct } from "@/modules/catalog/lib/toBranchProduct";
import { toProduct } from "@/modules/catalog/lib/toProduct";
import { contactEmailField, mobileField, nameField } from "@/modules/checkout/lib/checkoutSchema";
import { createGuestCustomer, readCustomerIdByEmail } from "@/modules/customers/lib/guestCustomer";
import { allocateOrderNumber, orderCounterRef } from "@/modules/orders/lib/orderIds";
import { orderCounterDocSchema } from "@/modules/orders/lib/orderSchema";
import { paymentExpiresAtFor } from "@/modules/orders/lib/payment/paymentWindow";
import { planPaymentEvent } from "@/modules/orders/lib/payment/planPaymentEvent";
import { priceOrder, type PricedOrder } from "@/modules/orders/lib/priceOrder";
import { orderToDoc, toOrder } from "@/modules/orders/lib/toOrder";
import type {
  Branch,
  BranchId,
  BranchProduct,
  IsoDate,
  IsoInstant,
  Order,
  OrderId,
  Product,
  ProductId,
  VisibleOrderStatus,
} from "@/shared/domain";
import { getDb } from "@/shared/lib/firebase/admin";
import { branchesRef, branchProductsRef, ordersRef, productsRef } from "@/shared/lib/firebase/collections";
import { readFirebaseEnv } from "@/shared/lib/firebase/env";
import { liveDataWarning } from "@/shared/lib/firebase/firebaseTarget";
import { parseDoc } from "@/shared/lib/firebase/parseDoc";
import { ORDER_CURRENCY } from "@/shared/lib/payments/paymentProvider";
import { formatCents } from "@/shared/utils/money";
import { logError } from "@/shared/utils/logError";
import { resolveSeedTarget } from "../seed/lib/guard";
import { seedDaysFor } from "../seed/lib/seedOrders";
import { type DemoOrder, demoOrders } from "./data/demoOrders";
import {
  type DemoStep,
  demoOrderId,
  dueSteps,
  isDemoOrderId,
  placedAt,
  remainingSteps,
  stampInstant,
} from "./lib/demoTimeline";
import { deleteAll, planOrderRemoval } from "./lib/removeOrders";

// bun run demo:orders:live [-- --yes]             adds today's demo orders
// bun run demo:orders:live -- --remove [--yes]    removes every demo order
// (or `bun --conditions=react-server scripts/live/demoOrders.ts …` on the emulator)
//
// A believable day of orders for the walkthrough (data/demoOrders.ts), made
// the way checkout and the admin make them: live prices and sold-out state
// through priceOrder, the next MS-number from the counter, guest customers
// through createGuestCustomer, staff steps through planOrderAction, and the
// online payments through planPaymentEvent with a test pi_ ref (no real
// Stripe payment). It doesn't call placeOrder: that refuses today's pickup
// after the cutoff, and online orders need Stripe.
//
// Doc IDs are demo-{pickupDate}-{key}, created with create(). A rerun skips
// orders that exist and applies only the staff steps now due; an order
// someone has changed by hand is left alone. Without --yes it only says what
// it would do. Same guard as the seed.

const contactSchema = z.object({ name: nameField, phone: mobileField, email: contactEmailField });

/** Thrown inside a transaction when the live catalogue can't sell an item: that order is skipped. */
class Unavailable extends Error {}

interface Planned {
  spec: DemoOrder;
  id: OrderId;
  pickupDate: IsoDate;
  placed: Date;
}

type Priced = Extract<PricedOrder, { ok: true }>;

/**
 * The order priced from the live catalogue, read through `getAll` (a
 * transaction's, or the database's). Lines the branch can't sell that day are
 * dropped and named, as checkout would take them out of the cart; null when
 * nothing is left.
 */
async function priceFor(
  getAll: (...refs: DocumentReference[]) => Promise<DocumentSnapshot[]>,
  branchId: BranchId,
  date: IsoDate,
  spec: DemoOrder,
): Promise<{ priced: Priced | null; dropped: string[] }> {
  const ids = spec.items.map(([, productId]) => productId);
  const snapshots = await getAll(
    ...ids.map((id) => productsRef().doc(id)),
    ...ids.map((id) => branchProductsRef(branchId).doc(id)),
  );
  const products = new Map<ProductId, Product>();
  const rows = new Map<ProductId, BranchProduct>();
  for (const snapshot of snapshots.slice(0, ids.length)) {
    if (snapshot.exists) products.set(snapshot.id as ProductId, toProduct(snapshot));
  }
  for (const snapshot of snapshots.slice(ids.length)) {
    if (snapshot.exists) rows.set(snapshot.id as ProductId, toBranchProduct(snapshot));
  }
  const items = spec.items.map(([quantity, productId]) => ({ productId, quantity }));
  const first = priceOrder({ date, items, products, branchProducts: rows });
  if (first.ok) return { priced: first, dropped: [] };

  const dropped = first.unavailable.map(
    (item) => `${item.name} ${item.reason === "sold_out" ? "sold out" : "not on the menu"}`,
  );
  const gone = new Set(first.unavailable.map((item) => item.productId));
  const rest = items.filter((item) => !gone.has(item.productId));
  if (rest.length === 0) return { priced: null, dropped };
  const second = priceOrder({ date, items: rest, products, branchProducts: rows });
  return { priced: second.ok ? second : null, dropped };
}

/** Places one demo order in a transaction, as checkout would; an online one is paid as its webhook would. */
async function createDemoOrder({ spec, id, pickupDate, placed }: Planned): Promise<{ order: Order; dropped: string[] }> {
  const contact = contactSchema.parse({ name: spec.name, phone: spec.phone, email: spec.email });
  const ref = ordersRef().doc(id);
  return getDb().runTransaction(async (tx: Transaction) => {
    if ((await tx.get(ref)).exists) throw new Error(`${id} was created by another run`);
    const { priced, dropped } = await priceFor((...refs) => tx.getAll(...refs), spec.branchId, pickupDate, spec);
    if (!priced) throw new Unavailable(dropped.join(", "));
    const existingCustomerId = await readCustomerIdByEmail(tx, contact.email);
    const orderNumber = await allocateOrderNumber(tx);

    const customerId = existingCustomerId ?? createGuestCustomer(tx, contact, placed);
    const online = spec.payment === "online";
    const sessionId = `cs_test_demo_${id}`;
    let order: Order = {
      id,
      orderNumber,
      branchId: spec.branchId,
      customerId,
      // Placed as guests, so in no account's history.
      accountId: null,
      contactName: contact.name,
      contactPhone: contact.phone,
      contactEmail: contact.email,
      pickupDate,
      status: online ? "awaiting_payment" : "placed",
      notes: spec.notes ?? "",
      items: priced.items,
      totalCents: priced.totalCents,
      paymentMethod: spec.payment,
      paymentStatus: "unpaid",
      paymentRef: null,
      processedStripeEventIds: [],
      checkoutSessionId: online ? sessionId : null,
      paymentExpiresAt: online ? paymentExpiresAtFor(placed) : null,
      recurringOrderId: null,
      generationNote: null,
      cancellationReason: null,
      cancellationNote: null,
      collectUndo: null,
      createdAt: placed.toISOString() as IsoInstant,
      paidAt: null,
      refundedAt: null,
      readyAt: null,
      collectedAt: null,
      cancelledAt: null,
    };

    if (online) {
      const event = {
        kind: "paid" as const,
        eventId: `evt_demo_${id}`,
        orderId: id,
        sessionId,
        paymentRef: `pi_demo_${pickupDate.replaceAll("-", "")}_${spec.key.replaceAll("-", "")}`,
        amountCents: order.totalCents,
        currency: ORDER_CURRENCY,
      };
      const plan = planPaymentEvent(order, event, new Date(placed.getTime() + 60_000));
      if (plan.outcome !== "placed") throw new Error(`${id}: payment planned as ${plan.outcome}`);
      order = { ...order, ...plan.changes, processedStripeEventIds: [event.eventId] };
    }

    tx.create(ref, orderToDoc(order));
    return { order, dropped };
  });
}

function actionFor(step: DemoStep, expectedStatus: VisibleOrderStatus): OrderActionRequest {
  switch (step.action) {
    case "ready":
      return { action: "ready", expectedStatus };
    case "collect":
      // Every demo collect on an unpaid order is "Yes, paid · Collected".
      return { action: "collect", expectedStatus, paymentConfirmed: true };
    case "cancel":
      return { action: "cancel", expectedStatus, reason: step.reason, note: step.note };
  }
}

/** One staff step at its own time, in a transaction that checks the status first, as A2/A3 do. */
async function applyStep(id: OrderId, pickupDate: IsoDate, step: DemoStep): Promise<Order> {
  const ref = ordersRef().doc(id);
  return getDb().runTransaction(async (tx) => {
    const order = toOrder(await tx.get(ref));
    const { status } = order;
    if (!isVisibleStatus(status)) throw new Error(`${order.orderNumber} is ${status}`);
    const current = { ...order, status };
    const action = orderActionSchema.parse(actionFor(step, status));
    const plan = planOrderAction(current, action, stampInstant(pickupDate, { daysFrom: 0, time: step.at }));
    const next = applyChanges(current, plan.changes);
    tx.set(ref, orderToDoc(next));
    return next;
  });
}

async function removeDemoOrders(write: boolean): Promise<void> {
  const all = await ordersRef().get();
  const demo = all.docs.filter((doc) => isDemoOrderId(doc.id));
  console.log(`  ${demo.length} demo orders:`);
  for (const doc of demo) {
    console.log(`    - ${doc.get("orderNumber")}  ${doc.id}  ${doc.get("contactName")}  ${doc.get("status")}`);
  }
  const removal = await planOrderRemoval(demo);
  console.log(removal.lines.map((line) => `  - ${line}`).join("\n"));
  if (!write) return;
  await deleteAll(removal.refs);
  console.log("Done. The order counter stays where it is, so the MS-numbers keep their gaps.");
}

async function addDemoOrders(write: boolean, now: Date): Promise<void> {
  const branchDocs = await branchesRef().get();
  const branches = new Map<BranchId, Branch>(branchDocs.docs.map((doc) => [doc.id as BranchId, toBranch(doc)]));
  const counter = await orderCounterRef().get();
  if (counter.exists) console.log(`  New orders take numbers from MS-${parseDoc(orderCounterDocSchema, counter).next}.`);

  let created = 0;
  let stepped = 0;
  for (const [index, spec] of demoOrders.entries()) {
    const branch = branches.get(spec.branchId);
    if (!branch) {
      console.warn(`  - ${spec.key}: no branch ${spec.branchId}; skipped`);
      continue;
    }
    const pickupDate = seedDaysFor(branch, now)[spec.day];
    const id = demoOrderId(pickupDate, spec.key) as OrderId;
    const label = `${spec.key} (${branch.name}, ${pickupDate}, ${spec.name})`;
    const snapshot = await ordersRef().doc(id).get();

    let status = snapshot.exists ? toOrder(snapshot).status : null;
    let number = snapshot.exists ? toOrder(snapshot).orderNumber : "new";
    if (!snapshot.exists) {
      const planned: Planned = { spec, id, pickupDate, placed: placedAt(pickupDate, spec.placed, now, index) };
      if (!write) {
        const { priced, dropped } = await priceFor((...refs) => getDb().getAll(...refs), spec.branchId, pickupDate, spec);
        if (!priced) {
          console.warn(`  - ${label}: would skip (${dropped.join(", ")})`);
          continue;
        }
        console.log(`  - ${label}: would place, ${formatCents(priced.totalCents)}, ${spec.payment === "online" ? "paid online" : "pay at pickup"}`);
        if (dropped.length > 0) console.log(`      without ${dropped.join(", ")}`);
        status = "placed";
      } else {
        try {
          const { order, dropped } = await createDemoOrder(planned);
          created += 1;
          status = order.status;
          number = order.orderNumber;
          console.log(`  - ${label}: placed ${number}, ${formatCents(order.totalCents)}${order.paymentStatus === "paid" ? ", paid online" : ""}`);
          if (dropped.length > 0) console.log(`      without ${dropped.join(", ")}`);
        } catch (error) {
          if (!(error instanceof Unavailable)) throw error;
          console.warn(`  - ${label}: skipped (${error.message})`);
          continue;
        }
      }
    } else {
      console.log(`  - ${label}: ${number} exists, ${status}`);
    }

    if (status === null) continue;
    const remaining = remainingSteps(spec.steps, status);
    if (remaining === null) {
      console.log(`      left alone: it's ${status}, which this script never makes it`);
      continue;
    }
    for (const step of dueSteps(remaining, pickupDate, now)) {
      if (!write) {
        console.log(`      would ${step.action} at ${step.at}`);
        continue;
      }
      const order = await applyStep(id, pickupDate, step);
      stepped += 1;
      console.log(`      ${step.action} at ${step.at} → ${order.status}`);
    }
  }
  if (write) console.log(`Done: ${created} placed, ${stepped} staff steps applied.`);
}

async function main(): Promise<void> {
  const target = resolveSeedTarget(process.argv.slice(2), readFirebaseEnv(), process.env);
  const write = process.argv.includes("--yes");
  const remove = process.argv.includes("--remove");

  if (!target.emulatorHost) console.warn(`\n${liveDataWarning(target.projectId)}\n`);
  console.log(
    `Demo orders on ${target.projectId}: ${remove ? "remove" : "add"}${write ? "" : " (dry run: add --yes to write)"}`,
  );
  if (remove) await removeDemoOrders(write);
  else await addDemoOrders(write, new Date());
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    logError(error, "demoOrders");
    process.exit(1);
  },
);
