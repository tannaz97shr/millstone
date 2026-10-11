import "server-only";
import { Timestamp, type Transaction } from "firebase-admin/firestore";
import { listBranches } from "@/modules/branches/lib/listBranches";
import { toBranch } from "@/modules/branches/lib/toBranch";
import { toBranchProduct } from "@/modules/catalog/lib/toBranchProduct";
import { toProduct } from "@/modules/catalog/lib/toProduct";
import { isOnMenu } from "@/modules/menu/lib/buildMenu";
import type {
  BranchProduct,
  CustomerId,
  IsoInstant,
  Product,
  ProductId,
  RecurringOrder,
  RecurringOrderId,
} from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { getDb } from "@/shared/lib/firebase/admin";
import { branchesRef, branchProductsRef, productsRef, recurringOrdersRef } from "@/shared/lib/firebase/collections";
import { logError } from "@/shared/utils/logError";
import { dueDates, isEnded, lockedThrough } from "@/shared/utils/pickup-dates";
import { withDeadline } from "@/shared/utils/withDeadline";
import { generateForRecurringOrder } from "./generation/generateForRecurringOrder";
import { checkFields, planAction, planEdit, type ChangePlan, type RecurringChanges } from "./planRecurringChange";
import { readOwnRecurringOrder } from "./recurringOrderReads";
import {
  MAX_LIVE_RECURRING_ORDERS,
  type CreateRecurringRequest,
  type RecurringActionRequest,
  type UpdateRecurringRequest,
} from "./recurringSchemas";
import { recurringOrderToDoc, toRecurringOrder } from "./toRecurringOrder";

// Customer writes to recurring orders (AC-R2, R4 to R7). Each runs in one
// transaction with the server's clock. Changes to an existing order first
// generate anything already due from it as it stood, so a change after a
// cutoff can never alter or back-fill that day's order.

const WRITE_DEADLINE_MS = 10_000;

const deadline = <T>(work: Promise<T>, what: string) =>
  withDeadline(work, WRITE_DEADLINE_MS, () => new ApiError(503, "unavailable", `${what} took over ${WRITE_DEADLINE_MS}ms`));

function throwRefusal(plan: Extract<ChangePlan, { kind: "refused" }>): never {
  throw new ApiError(plan.status, plan.code, plan.message, {
    ...(plan.earliest ? { earliest: plan.earliest } : {}),
    ...(plan.items ? { items: plan.items } : {}),
  });
}

/** Reads products and one branch's rows inside a transaction. */
async function readCatalogIn(tx: Transaction, branchId: RecurringOrder["branchId"], productIds: readonly ProductId[]) {
  const ids = [...new Set(productIds)];
  const snapshots = ids.length
    ? await tx.getAll(...ids.map((id) => productsRef().doc(id)), ...ids.map((id) => branchProductsRef(branchId).doc(id)))
    : [];
  const products = new Map<ProductId, Product>();
  const rows = new Map<ProductId, BranchProduct>();
  for (const snapshot of snapshots.slice(0, ids.length)) {
    if (snapshot.exists) products.set(snapshot.id as ProductId, toProduct(snapshot));
  }
  for (const snapshot of snapshots.slice(ids.length)) {
    if (snapshot.exists) rows.set(snapshot.id as ProductId, toBranchProduct(snapshot));
  }
  const onMenu = new Set(ids.filter((id) => {
    const product = products.get(id);
    return product !== undefined && isOnMenu(product, rows.get(id));
  }));
  const names = new Map([...products].map(([id, product]) => [id, product.name]));
  return { onMenu, names };
}

/** POST /api/account/recurring-orders: a new, active recurring order (AC-R2). */
export async function createRecurringOrder(
  customerId: CustomerId,
  request: CreateRecurringRequest,
  now: Date,
): Promise<RecurringOrderId> {
  const ref = recurringOrdersRef().doc();
  const branches = await listBranches();

  const transaction = getDb().runTransaction(async (tx) => {
    const branchSnapshot = await tx.get(branchesRef().doc(request.branchId));
    if (!branchSnapshot.exists) throw new ApiError(404, "unknown_branch", `No branch "${request.branchId}"`);
    const branch = toBranch(branchSnapshot);

    const existing = (await tx.get(recurringOrdersRef().where("customerId", "==", customerId))).docs.map(toRecurringOrder);
    const live = existing.filter((recurringOrder) => {
      const itsBranch = branches.find((candidate) => candidate.id === recurringOrder.branchId);
      return itsBranch ? !isEnded(recurringOrder, itsBranch, now) : false;
    });
    if (live.length >= MAX_LIVE_RECURRING_ORDERS) {
      throw new ApiError(422, "limit_reached", `This account already has ${live.length} recurring orders`);
    }

    const { onMenu, names } = await readCatalogIn(tx, branch.id, request.items.map((item) => item.productId));
    const problem = checkFields({
      branch,
      daysOfWeek: request.daysOfWeek,
      items: request.items,
      startsOn: request.startsOn,
      endsOn: request.endsOn,
      onMenu,
      names,
      alreadyIn: new Set(),
      checkStart: true,
      checkEnd: true,
      now,
    });
    if (problem?.kind === "refused") throwRefusal(problem);

    const stamp = now.toISOString() as IsoInstant;
    tx.create(
      ref,
      recurringOrderToDoc({
        customerId,
        branchId: branch.id,
        daysOfWeek: [...request.daysOfWeek],
        status: "active",
        startsOn: request.startsOn,
        endsOn: request.endsOn,
        notes: request.notes,
        items: request.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        skipDates: [],
        // Every date up to now is locked and before the start: nothing to look at.
        generatedThrough: lockedThrough(branch, now),
        version: 0,
        createdAt: stamp,
        updatedAt: stamp,
      }),
    );
  });

  await deadline(transaction, "Creating a recurring order");
  return ref.id as RecurringOrderId;
}

type Planner = (recurringOrder: RecurringOrder, branch: ReturnType<typeof toBranch>, tx: Transaction) => Promise<ChangePlan>;

/**
 * The shared path for every change to an existing order: check it's the
 * customer's (else 404), generate what's due as it stands, then plan and
 * save the change in a transaction that refuses to run if anything is still due.
 */
async function changeRecurringOrder(
  customerId: CustomerId,
  recurringOrderId: string,
  now: Date,
  what: string,
  plan: Planner,
): Promise<void> {
  const own = await readOwnRecurringOrder(customerId, recurringOrderId);

  const generated = await generateForRecurringOrder(own.id, now).catch((error: unknown) => {
    logError(error, `${what}: generate before write ${own.id}`);
    throw new ApiError(503, "try_again", "Couldn't bring this recurring order up to date; try again");
  });
  if (generated.outcome === "failed") {
    logError(new Error(generated.reason), `${what}: generate before write ${own.id}`);
    throw new ApiError(503, "try_again", "Couldn't bring this recurring order up to date; try again");
  }

  const ref = recurringOrdersRef().doc(own.id);
  const transaction = getDb().runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) throw new ApiError(404, "not_found", "No such recurring order in this account");
    const recurringOrder = toRecurringOrder(snapshot);
    if (recurringOrder.customerId !== customerId) throw new ApiError(404, "not_found", "No such recurring order in this account");
    const branchSnapshot = await tx.get(branchesRef().doc(recurringOrder.branchId));
    if (!branchSnapshot.exists) throw new Error(`Recurring order ${recurringOrder.id} is for a missing branch`);
    const branch = toBranch(branchSnapshot);

    // Generation above moved the cursor to the last locked date. If it hasn't
    // (a run racing this one), the change waits: never alter a locked day.
    if (dueDates(recurringOrder, branch, now).length > 0) {
      throw new ApiError(503, "try_again", "This recurring order is being brought up to date; try again");
    }

    const result = await plan(recurringOrder, branch, tx);
    if (result.kind === "refused") throwRefusal(result);
    const changes: RecurringChanges = result.changes;
    tx.update(ref, {
      ...changes,
      version: recurringOrder.version + 1,
      updatedAt: Timestamp.fromDate(now),
    });
  });
  await deadline(transaction, what);
}

/** PATCH /api/account/recurring-orders/{id}: C11's changes (AC-R4). */
export async function updateRecurringOrder(
  customerId: CustomerId,
  recurringOrderId: string,
  request: UpdateRecurringRequest,
  now: Date,
): Promise<void> {
  await changeRecurringOrder(customerId, recurringOrderId, now, "Saving a recurring order", async (recurringOrder, branch, tx) => {
    const ids = [...recurringOrder.items, ...request.items].map((item) => item.productId);
    const { onMenu, names } = await readCatalogIn(tx, branch.id, ids);
    return planEdit({ recurringOrder, branch, request, onMenu, names, now });
  });
}

/** POST /api/account/recurring-orders/{id}/actions: C12's pause, resume, skip, undo and end (AC-R5 to R7). */
export async function applyRecurringAction(
  customerId: CustomerId,
  recurringOrderId: string,
  request: RecurringActionRequest,
  now: Date,
): Promise<void> {
  await changeRecurringOrder(customerId, recurringOrderId, now, `Recurring order ${request.action}`, async (recurringOrder, branch) =>
    planAction({ recurringOrder, branch, request, now }),
  );
}
