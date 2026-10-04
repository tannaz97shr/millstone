import "server-only";
import type { Query } from "firebase-admin/firestore";
import { branchScope, type StaffActor } from "@/modules/auth/lib/requireSession";
import { listBranches } from "@/modules/branches/lib/listBranches";
import { toOrder } from "@/modules/orders/lib/toOrder";
import {
  buildSearchTokens,
  matchesAllTokens,
  parseSearchQuery,
  primarySearchToken,
} from "@/modules/orders/lib/search/orderSearch";
import type { Branch, BranchId, IsoDate, IsoInstant, Order, VisibleOrderStatus } from "@/shared/domain";
import { ordersRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { addDays, melbourneDateOf } from "@/shared/utils/pickup-dates";
import type { AdminBranchOption, AdminOrderList, AdminOrderRow } from "../types/adminOrder";
import {
  type AdminOrderFilters,
  isFinalFilter,
  isSearching,
  STATUSES_FOR,
  type StatusFilter,
} from "./orderFilters";
import { isVisibleStatus } from "./paymentLabel";
import { toAdminOrderRow } from "./toAdminOrder";

/** A search shows at most this many orders, newest pickup dates first. */
export const SEARCH_LIMIT = 100;
/** A safety net for the list itself; a bakery's open orders stay far below it. */
export const LIST_LIMIT = 500;
/** Collected and cancelled on "All dates": today and the 13 days before (decided 4 Oct 2026). */
export const FINAL_ORDERS_DAYS = 14;

interface Scope {
  branchId: BranchId | null;
  today: IsoDate;
  tomorrow: IsoDate;
  finalSince: IsoDate;
}

function resolveDate(filters: AdminOrderFilters, scope: Scope): IsoDate | null {
  if (filters.date === "all") return null;
  if (filters.date === "today") return scope.today;
  if (filters.date === "tomorrow") return scope.tomorrow;
  return filters.date;
}

/** Branch and date conditions, shared by the list and its counts. */
function scoped(query: Query, filters: AdminOrderFilters, scope: Scope, status: StatusFilter): Query {
  let q = query;
  if (scope.branchId) q = q.where("branchId", "==", scope.branchId);
  const date = resolveDate(filters, scope);
  if (date) q = q.where("pickupDate", "==", date);
  else if (isFinalFilter(status)) q = q.where("pickupDate", ">=", scope.finalSince);
  return q;
}

function statusQuery(filters: AdminOrderFilters, scope: Scope, status: StatusFilter): Query {
  const statuses = STATUSES_FOR[status];
  const base =
    statuses.length === 1
      ? ordersRef().where("status", "==", statuses[0])
      : ordersRef().where("status", "in", statuses);
  return scoped(base, filters, scope, status);
}

async function countStatus(filters: AdminOrderFilters, scope: Scope, status: StatusFilter): Promise<number> {
  const snapshot = await firestoreRead(statusQuery(filters, scope, status).count().get(), `orders count ${status}`);
  return snapshot.data().count;
}

async function countAll(filters: AdminOrderFilters, scope: Scope): Promise<Record<StatusFilter, number>> {
  const [placed, ready, collected, cancelled] = await Promise.all(
    (["placed", "ready", "collected", "cancelled"] as const).map((status) => countStatus(filters, scope, status)),
  );
  return { todo: placed + ready, placed, ready, collected, cancelled };
}

function visible(orders: Order[]): (Order & { status: VisibleOrderStatus })[] {
  return orders.flatMap((order) => {
    const { status } = order;
    return isVisibleStatus(status) ? [{ ...order, status }] : [];
  });
}

async function searchOrders(q: string, scope: Scope): Promise<{ orders: Order[]; capped: boolean }> {
  const tokens = parseSearchQuery(q);
  const primary = primarySearchToken(tokens);
  if (!primary) return { orders: [], capped: false };
  let query: Query = ordersRef().where("searchTokens", "array-contains", primary);
  if (scope.branchId) query = query.where("branchId", "==", scope.branchId);
  const snapshot = await firestoreRead(
    query.orderBy("pickupDate", "desc").limit(SEARCH_LIMIT).get(),
    "orders search",
  );
  const orders = snapshot.docs
    .map(toOrder)
    .filter((order) => matchesAllTokens(buildSearchTokens(order), tokens));
  return { orders, capped: snapshot.size === SEARCH_LIMIT };
}

function toBranchOption(branch: Branch): AdminBranchOption {
  return { id: branch.id, name: branch.name, closedDays: [...branch.closedDays] };
}

/**
 * A2's list (AC-A2, A3): the orders for the filters, or a search across every
 * date and status. Staff only ever get their own branch; asking for another
 * is a 403 from branchScope. awaiting_payment and expired never come back.
 */
export async function listAdminOrders(
  actor: StaffActor,
  filters: AdminOrderFilters,
  now: Date,
): Promise<AdminOrderList> {
  const branchId = branchScope(actor, filters.branch);
  const today = melbourneDateOf(now);
  const scope: Scope = {
    branchId,
    today,
    tomorrow: addDays(today, 1),
    finalSince: addDays(today, -(FINAL_ORDERS_DAYS - 1)),
  };

  const allBranches = await listBranches();
  // The owner always gets every branch (for the filter buttons and headings); staff only theirs.
  const inScope = actor.role === "owner" ? allBranches : allBranches.filter((branch) => branch.id === branchId);
  const names = new Map(allBranches.map((branch) => [branch.id, branch.name]));
  const toRow = (order: Order & { status: VisibleOrderStatus }): AdminOrderRow =>
    toAdminOrderRow(order, { name: names.get(order.branchId) ?? order.branchId });

  const base = {
    today: scope.today,
    tomorrow: scope.tomorrow,
    branches: inScope.map(toBranchOption),
    generatedAt: now.toISOString() as IsoInstant,
  };

  if (isSearching(filters)) {
    const { orders, capped } = await searchOrders(filters.q, scope);
    return { ...base, orders: visible(orders).map(toRow), counts: null, finalSince: null, capped };
  }

  const [snapshot, counts] = await Promise.all([
    firestoreRead(statusQuery(filters, scope, filters.status).limit(LIST_LIMIT).get(), "orders list"),
    countAll(filters, scope),
  ]);
  return {
    ...base,
    orders: visible(snapshot.docs.map(toOrder)).map(toRow),
    counts,
    finalSince: filters.date === "all" && isFinalFilter(filters.status) ? scope.finalSince : null,
    capped: snapshot.size === LIST_LIMIT,
  };
}
