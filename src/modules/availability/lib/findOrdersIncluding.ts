import "server-only";
import { toOrder } from "@/modules/orders/lib/toOrder";
import type { BranchId, IsoDate, OrderStatus, ProductId } from "@/shared/domain";
import { ordersRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import type { AffectedOrders } from "../types/availability";
import { summariseAffectedOrders } from "./affectedOrders";

/** Orders still to be collected. Awaiting-payment orders aren't confirmed, and staff never see them. */
const OPEN_STATUSES: OrderStatus[] = ["placed", "ready"];

export type AffectedDays = { date: IsoDate } | { from: IsoDate };

/**
 * Open orders at a branch that include a product, for one pickup date or from
 * a date on. Read only, after the change is saved: staff call these customers,
 * and the orders themselves never change (they keep their items and prices).
 */
export async function findOrdersIncluding(
  branchId: BranchId,
  productId: ProductId,
  days: AffectedDays,
): Promise<AffectedOrders> {
  const base = ordersRef().where("branchId", "==", branchId).where("status", "in", OPEN_STATUSES);
  const query =
    "date" in days ? base.where("pickupDate", "==", days.date) : base.where("pickupDate", ">=", days.from);
  const snapshot = await firestoreRead(query.get(), `orders including ${productId}`);

  return summariseAffectedOrders(snapshot.docs.map(toOrder), productId);
}
