import "server-only";
import { listBranches } from "@/modules/branches/lib/listBranches";
import { toBranchProduct } from "@/modules/catalog/lib/toBranchProduct";
import { toProduct } from "@/modules/catalog/lib/toProduct";
import { toOrder } from "@/modules/orders/lib/toOrder";
import type {
  Branch,
  BranchProduct,
  CustomerId,
  IsoDate,
  Product,
  ProductId,
  RecurringOrder,
  RecurringOrderId,
} from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { getDb } from "@/shared/lib/firebase/admin";
import { branchProductsRef, ordersRef, productsRef, recurringOrdersRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { isEnded, melbourneDateOf } from "@/shared/utils/pickup-dates";
import type { RecurringOrderDetail, RecurringOrdersResponse } from "../types/recurringOrderView";
import { toRecurringOrder } from "./toRecurringOrder";
import { toRecurringOrderDetail, toRecurringOrderSummary, type RecurringViewInput } from "./toRecurringOrderView";

// Reads for C9 to C12. A recurring order that isn't the signed-in
// customer's answers exactly like one that doesn't exist (404), so a guessed
// ID gives nothing away.

const notFound = () => new ApiError(404, "not_found", "No such recurring order in this account");

/** The customer's recurring order, or 404. */
export async function readOwnRecurringOrder(customerId: CustomerId, recurringOrderId: string): Promise<RecurringOrder> {
  const snapshot = await firestoreRead(recurringOrdersRef().doc(recurringOrderId).get(), "recurringOrders");
  if (!snapshot.exists) throw notFound();
  const recurringOrder = toRecurringOrder(snapshot);
  if (recurringOrder.customerId !== customerId) throw notFound();
  return recurringOrder;
}

/** Products and one branch's rows for a set of product IDs, by ID. */
export async function readCatalogFor(
  branchId: Branch["id"],
  productIds: readonly ProductId[],
): Promise<{ products: Map<ProductId, Product>; branchProducts: Map<ProductId, BranchProduct> }> {
  const ids = [...new Set(productIds)];
  const products = new Map<ProductId, Product>();
  const branchProducts = new Map<ProductId, BranchProduct>();
  if (ids.length === 0) return { products, branchProducts };
  const snapshots = await firestoreRead(
    getDb().getAll(...ids.map((id) => productsRef().doc(id)), ...ids.map((id) => branchProductsRef(branchId).doc(id))),
    "recurring order catalogue",
  );
  for (const snapshot of snapshots.slice(0, ids.length)) {
    if (snapshot.exists) products.set(snapshot.id as ProductId, toProduct(snapshot));
  }
  for (const snapshot of snapshots.slice(ids.length)) {
    if (snapshot.exists) branchProducts.set(snapshot.id as ProductId, toBranchProduct(snapshot));
  }
  return { products, branchProducts };
}

/** Generated orders from today on that still stand (not cancelled), by pickup date. */
async function readMadeOrders(recurringOrderId: RecurringOrderId, today: IsoDate): Promise<Map<IsoDate, string>> {
  const snapshot = await firestoreRead(
    ordersRef().where("recurringOrderId", "==", recurringOrderId).where("pickupDate", ">=", today).get(),
    "generated orders",
  );
  const made = new Map<IsoDate, string>();
  for (const doc of snapshot.docs) {
    const order = toOrder(doc);
    if (order.status !== "cancelled" && order.status !== "expired") made.set(order.pickupDate, order.orderNumber);
  }
  return made;
}

async function viewInput(recurringOrder: RecurringOrder, branch: Branch, now: Date): Promise<RecurringViewInput> {
  const [catalog, made] = await Promise.all([
    readCatalogFor(branch.id, recurringOrder.items.map((item) => item.productId)),
    readMadeOrders(recurringOrder.id, melbourneDateOf(now)),
  ]);
  return { recurringOrder, branch, ...catalog, made, now };
}

function branchOf(branches: readonly Branch[], recurringOrder: RecurringOrder): Branch {
  const branch = branches.find((candidate) => candidate.id === recurringOrder.branchId);
  // Branches are never deleted; a recurring order pointing at a missing one is a data fault.
  if (!branch) throw new Error(`Recurring order ${recurringOrder.id} is for a missing branch ${recurringOrder.branchId}`);
  return branch;
}

/** Every recurring order of the account. */
export async function readAccountRecurringOrders(customerId: CustomerId): Promise<RecurringOrder[]> {
  const snapshot = await firestoreRead(
    recurringOrdersRef().where("customerId", "==", customerId).orderBy("createdAt", "desc").get(),
    "account recurring orders",
  );
  return snapshot.docs.map(toRecurringOrder);
}

/** C10 and C9: live ones first, then ended; newest first within each. */
export async function listRecurringOrders(customerId: CustomerId, now: Date): Promise<RecurringOrdersResponse> {
  const [recurringOrders, branches] = await Promise.all([readAccountRecurringOrders(customerId), listBranches()]);
  const summaries = await Promise.all(
    recurringOrders.map(async (recurringOrder) =>
      toRecurringOrderSummary(await viewInput(recurringOrder, branchOf(branches, recurringOrder), now)),
    ),
  );
  const ended = (status: string) => (status === "ended" ? 1 : 0);
  return {
    recurringOrders: summaries
      .map((summary, index) => ({ summary, index }))
      .sort((a, b) => ended(a.summary.status) - ended(b.summary.status) || a.index - b.index)
      .map(({ summary }) => summary),
  };
}

/** C12 and C11 edit. */
export async function getRecurringOrderDetail(
  customerId: CustomerId,
  recurringOrderId: string,
  now: Date,
): Promise<RecurringOrderDetail> {
  const [recurringOrder, branches] = await Promise.all([
    readOwnRecurringOrder(customerId, recurringOrderId),
    listBranches(),
  ]);
  return toRecurringOrderDetail(await viewInput(recurringOrder, branchOf(branches, recurringOrder), now));
}

/** How many of the account's recurring orders haven't ended (the cap, MAX_LIVE_RECURRING_ORDERS). */
export function countLive(recurringOrders: readonly RecurringOrder[], branches: readonly Branch[], now: Date): number {
  return recurringOrders.filter((recurringOrder) => !isEnded(recurringOrder, branchOf(branches, recurringOrder), now)).length;
}
