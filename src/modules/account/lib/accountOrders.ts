import "server-only";
import { toBranch } from "@/modules/branches/lib/toBranch";
import { toOrder } from "@/modules/orders/lib/toOrder";
import type { Branch, BranchId, CustomerId, Order, OrderId, VisibleOrderStatus } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { getDb } from "@/shared/lib/firebase/admin";
import { branchesRef, ordersRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import type { AccountOrder, AccountOrdersResponse } from "../types/accountOrder";
import { isVisibleToCustomer, toAccountOrder } from "./toAccountOrder";

/** C9 shows the latest orders only; a bakery account rarely has more. */
export const ACCOUNT_ORDERS_LIMIT = 50;

const notFound = () => new ApiError(404, "not_found", "No such order");

async function readBranches(branchIds: Iterable<BranchId>): Promise<Map<BranchId, Branch>> {
  const ids = [...new Set(branchIds)];
  if (ids.length === 0) return new Map();
  const snapshots = await firestoreRead(getDb().getAll(...ids.map((id) => branchesRef().doc(id))), "branches");
  const branches = new Map<BranchId, Branch>();
  for (const snapshot of snapshots) {
    if (snapshot.exists) branches.set(snapshot.id as BranchId, toBranch(snapshot));
  }
  return branches;
}

function visible(order: Order): order is Order & { status: VisibleOrderStatus } {
  return isVisibleToCustomer(order.status);
}

/**
 * C9 "Your orders": the account's own history (`accountId`), newest pickup
 * day first. Guest orders linked by email alone aren't in it (see Order.accountId).
 */
export async function listAccountOrders(customerId: CustomerId): Promise<AccountOrdersResponse> {
  const snapshot = await firestoreRead(
    ordersRef()
      .where("accountId", "==", customerId)
      .orderBy("pickupDate", "desc")
      .orderBy("createdAt", "desc")
      .limit(ACCOUNT_ORDERS_LIMIT)
      .get(),
    "orders (account history)",
  );
  const orders = snapshot.docs.map(toOrder).filter(visible);
  const branches = await readBranches(orders.map((order) => order.branchId));
  const result: AccountOrder[] = [];
  for (const order of orders) {
    const branch = branches.get(order.branchId);
    if (!branch) throw new Error(`Order ${order.orderNumber} names a missing branch ${order.branchId}`);
    result.push(toAccountOrder(order, branch));
  }
  return { orders: result, limited: snapshot.size === ACCOUNT_ORDERS_LIMIT };
}

/**
 * One of the account's own orders. Anyone else's order, a guest order, or
 * one never placed is the same 404 as a missing one, so an ID can't be probed.
 */
export async function getAccountOrder(customerId: CustomerId, orderId: OrderId): Promise<AccountOrder> {
  const snapshot = await firestoreRead(ordersRef().doc(orderId).get(), `orders/${orderId}`);
  if (!snapshot.exists) throw notFound();
  const order = toOrder(snapshot);
  if (order.accountId !== customerId || !visible(order)) throw notFound();
  const branch = (await readBranches([order.branchId])).get(order.branchId);
  if (!branch) throw new Error(`Order ${order.orderNumber} names a missing branch ${order.branchId}`);
  return toAccountOrder(order, branch);
}
