import { isOnMenu } from "@/modules/menu/lib/buildMenu";
import type { Branch, BranchProduct, IsoDate, Product, ProductId, RecurringOrder } from "@/shared/domain";
import {
  displayStatus,
  earliestPickupDate,
  endDateOptions,
  firstChangeableDate,
  firstPickupFrom,
  nextPickup,
  stopNowEndsOn,
  upcomingPickups,
} from "@/shared/utils/pickup-dates";
import type {
  RecurringBranchView,
  RecurringItemView,
  RecurringOrderDetail,
  RecurringOrderSummary,
} from "../types/recurringOrderView";
import { hasStarted } from "./planRecurringChange";

// Pure: a stored recurring order, with what it needs read around it, as the
// screens see it. The loaders (recurringOrderReads.ts) do the reading.

export interface RecurringViewInput {
  recurringOrder: RecurringOrder;
  branch: Branch;
  products: ReadonlyMap<ProductId, Product>;
  /** This branch's rows by product ID; a missing entry means available. */
  branchProducts: ReadonlyMap<ProductId, BranchProduct>;
  /** Pickup dates from today that already have a (not cancelled) generated order, with its number. */
  made: ReadonlyMap<IsoDate, string>;
  now: Date;
}

export function toRecurringBranchView(branch: Branch): RecurringBranchView {
  return {
    id: branch.id,
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    orderCutoffTime: branch.orderCutoffTime,
    closedDays: [...branch.closedDays],
  };
}

function itemViews({ recurringOrder, products, branchProducts }: RecurringViewInput): RecurringItemView[] {
  return recurringOrder.items.map(({ productId, quantity }) => {
    const product = products.get(productId);
    const onMenu = product !== undefined && isOnMenu(product, branchProducts.get(productId));
    return {
      productId,
      name: product?.name ?? productId,
      quantity,
      onMenu,
      priceCents: onMenu && product ? product.priceCents : null,
    };
  });
}

export function toRecurringOrderSummary(input: RecurringViewInput): RecurringOrderSummary {
  const { recurringOrder, branch, made, now } = input;
  return {
    id: recurringOrder.id,
    version: recurringOrder.version,
    branch: toRecurringBranchView(branch),
    daysOfWeek: [...recurringOrder.daysOfWeek],
    status: displayStatus(recurringOrder, branch, now),
    items: itemViews(input),
    startsOn: recurringOrder.startsOn,
    endsOn: recurringOrder.endsOn,
    next: nextPickup(recurringOrder, branch, now, made),
  };
}

export function toRecurringOrderDetail(input: RecurringViewInput): RecurringOrderDetail {
  const { recurringOrder, branch, made, now } = input;
  const firstChangeable = firstChangeableDate(branch, now);
  const from = recurringOrder.startsOn > firstChangeable ? recurringOrder.startsOn : firstChangeable;
  return {
    ...toRecurringOrderSummary(input),
    notes: recurringOrder.notes,
    upcoming: upcomingPickups(recurringOrder, branch, now, made),
    firstChangeable,
    started: hasStarted(recurringOrder, branch, now),
    earliestStart: earliestPickupDate(branch, now),
    endDateOptions: endDateOptions(recurringOrder, branch, now),
    stopNowEndsOn: stopNowEndsOn(recurringOrder, branch, now),
    firstNewPickup: firstPickupFrom(recurringOrder, branch, from),
  };
}
