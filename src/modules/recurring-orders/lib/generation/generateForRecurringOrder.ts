import "server-only";
import { toBranch } from "@/modules/branches/lib/toBranch";
import { toBranchProduct } from "@/modules/catalog/lib/toBranchProduct";
import { toProduct } from "@/modules/catalog/lib/toProduct";
import { toCustomer } from "@/modules/customers/lib/toCustomer";
import { allocateOrderNumbers, generatedOrderId } from "@/modules/orders/lib/orderIds";
import { orderToDoc } from "@/modules/orders/lib/toOrder";
import type {
  BranchId,
  BranchProduct,
  Cents,
  IsoDate,
  Product,
  ProductId,
  RecurringOrderId,
} from "@/shared/domain";
import type { UnavailableItem } from "@/shared/lib/api/apiError";
import { getDb } from "@/shared/lib/firebase/admin";
import {
  branchesRef,
  branchProductsRef,
  customersRef,
  ordersRef,
  productsRef,
  recurringOrdersRef,
} from "@/shared/lib/firebase/collections";
import { dueDates } from "@/shared/utils/pickup-dates";
import { withDeadline } from "@/shared/utils/withDeadline";
import { toRecurringOrder } from "../toRecurringOrder";
import { planGeneration, type SkipReason } from "./planGeneration";

/** Longer than a read's 5s: a transaction makes several round trips and may retry on contention. */
const GENERATE_DEADLINE_MS = 10_000;

export type GeneratedDate =
  | {
      date: IsoDate;
      outcome: "created";
      /** Null on a dry run: numbers are only taken when the order is written. */
      orderNumber: string | null;
      itemCount: number;
      totalCents: Cents;
      dropped: UnavailableItem[];
    }
  | { date: IsoDate; outcome: "exists" }
  | { date: IsoDate; outcome: "skipped"; reason: SkipReason };

export type GenerationResult =
  | { recurringOrderId: RecurringOrderId; outcome: "nothing_due" }
  | {
      recurringOrderId: RecurringOrderId;
      outcome: "generated";
      branchId: BranchId;
      dates: GeneratedDate[];
      generatedThrough: IsoDate;
    }
  /** Nothing written; the cursor stays, so the next run tries again. */
  | { recurringOrderId: RecurringOrderId; outcome: "failed"; reason: "recurring_order_missing" | "branch_missing" | "customer_missing" };

export interface GenerateOptions {
  /** Plan without writing anything (bun run recurring:generate without --yes). */
  dryRun?: boolean;
}

/**
 * Generates every due order of one recurring order (spec 8, AC-R8, R9) in one
 * transaction: reads the recurring order, its branch and customer, each due
 * date's deterministic order doc, the products and the branch's rows, then
 * creates the orders (numbers from the counter) and moves the cursor. Safe to
 * run any number of times: see planGeneration. Customer writes call it first,
 * so an edit after a cutoff never changes that day's order (AC-R4, R6).
 */
export async function generateForRecurringOrder(
  recurringOrderId: RecurringOrderId,
  now: Date,
  { dryRun = false }: GenerateOptions = {},
): Promise<GenerationResult> {
  const recurringRef = recurringOrdersRef().doc(recurringOrderId);

  const transaction = getDb().runTransaction(async (tx): Promise<GenerationResult> => {
    // Reads, all before the first write.
    const recurringSnapshot = await tx.get(recurringRef);
    if (!recurringSnapshot.exists) return { recurringOrderId, outcome: "failed", reason: "recurring_order_missing" };
    const recurringOrder = toRecurringOrder(recurringSnapshot);

    const branchSnapshot = await tx.get(branchesRef().doc(recurringOrder.branchId));
    if (!branchSnapshot.exists) return { recurringOrderId, outcome: "failed", reason: "branch_missing" };
    const branch = toBranch(branchSnapshot);

    // Most calls (customer writes, reruns) end here, before reading the catalogue.
    const due = dueDates(recurringOrder, branch, now);
    if (due.length === 0) return { recurringOrderId, outcome: "nothing_due" };

    const productIds = recurringOrder.items.map((item) => item.productId);
    const [customerSnapshot, ...rest] = await tx.getAll(
      customersRef().doc(recurringOrder.customerId),
      ...due.map((date) => ordersRef().doc(generatedOrderId(recurringOrderId, date))),
      ...productIds.map((id) => productsRef().doc(id)),
      ...productIds.map((id) => branchProductsRef(recurringOrder.branchId).doc(id)),
    );
    const orderSnapshots = rest.slice(0, due.length);
    const productSnapshots = rest.slice(due.length, due.length + productIds.length);
    const rowSnapshots = rest.slice(due.length + productIds.length);

    const products = new Map<ProductId, Product>();
    for (const snapshot of productSnapshots) {
      if (snapshot.exists) products.set(snapshot.id as ProductId, toProduct(snapshot));
    }
    const branchProducts = new Map<ProductId, BranchProduct>();
    for (const snapshot of rowSnapshots) {
      if (snapshot.exists) branchProducts.set(snapshot.id as ProductId, toBranchProduct(snapshot));
    }
    const existingDates = new Set(due.filter((_, i) => orderSnapshots[i].exists));

    const plan = planGeneration({
      recurringOrder,
      branch,
      customer: customerSnapshot.exists ? toCustomer(customerSnapshot) : null,
      products,
      branchProducts,
      existingDates,
      now,
    });
    if (plan.kind === "nothing_due") return { recurringOrderId, outcome: "nothing_due" };
    if (plan.kind === "failed") return { recurringOrderId, outcome: "failed", reason: plan.reason };

    const creates = plan.dates.filter((date) => date.kind === "create");
    const numbers = dryRun ? creates.map(() => null) : await allocateOrderNumbers(tx, creates.length);

    // Writes.
    const dates: GeneratedDate[] = [];
    let created = 0;
    for (const date of plan.dates) {
      if (date.kind === "exists") {
        dates.push({ date: date.date, outcome: "exists" });
      } else if (date.kind === "skip") {
        dates.push({ date: date.date, outcome: "skipped", reason: date.reason });
      } else {
        const orderNumber = numbers[created];
        created += 1;
        if (orderNumber !== null) {
          tx.create(ordersRef().doc(generatedOrderId(recurringOrderId, date.date)), orderToDoc({ ...date.order, orderNumber }));
        }
        dates.push({
          date: date.date,
          outcome: "created",
          orderNumber,
          itemCount: date.order.items.length,
          totalCents: date.order.totalCents,
          dropped: date.dropped,
        });
      }
    }
    // The cursor only: not a customer change, so `version` and `updatedAt` stay.
    if (!dryRun) tx.update(recurringRef, { generatedThrough: plan.generatedThrough });

    return {
      recurringOrderId,
      outcome: "generated",
      branchId: recurringOrder.branchId,
      dates,
      generatedThrough: plan.generatedThrough,
    };
  });

  return withDeadline(
    transaction,
    GENERATE_DEADLINE_MS,
    () => new Error(`Generating ${recurringOrderId} took over ${GENERATE_DEADLINE_MS}ms`),
  );
}
