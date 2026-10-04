import "server-only";
import { branchScope, type StaffActor } from "@/modules/auth/lib/requireSession";
import { listBranches } from "@/modules/branches/lib/listBranches";
import { listProducts } from "@/modules/catalog/lib/listProducts";
import { readCategoryOrder } from "@/modules/catalog/lib/readCategoryOrder";
import { toBranchProduct } from "@/modules/catalog/lib/toBranchProduct";
import type { Branch, BranchId } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { branchProductsRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { addDays, melbourneDateOf, pickupCalendar } from "@/shared/utils/pickup-dates";
import type { AvailabilityCalendar, BranchAvailability } from "../types/availability";
import { AVAILABILITY_PICKER_DAYS } from "./availabilityRules";
import { buildAvailability } from "./buildAvailability";

export function availabilityCalendar(branch: Branch, now: Date): AvailabilityCalendar {
  const calendar = pickupCalendar(branch, now);
  const last = addDays(calendar.earliest, AVAILABILITY_PICKER_DAYS - 1);
  return {
    today: melbourneDateOf(now),
    earliest: calendar.earliest,
    days: AVAILABILITY_PICKER_DAYS,
    orderableDates: calendar.orderableDates.filter((date) => date <= last),
    closedWeekdays: [...branch.closedDays],
    cutoffTime: branch.orderCutoffTime,
    pastTodaysCutoff: calendar.pastTodaysCutoff,
  };
}

/**
 * A4 for one branch (GET /api/admin/branches/{id}/availability, and the page's
 * prefetch). Staff asking for another branch get 403 (branchScope); an
 * unknown branch is a 404.
 */
export async function getBranchAvailability(
  actor: StaffActor,
  branchId: BranchId,
  now: Date,
): Promise<BranchAvailability> {
  branchScope(actor, branchId);
  const owner = actor.role === "owner";

  const [branches, products, rowsSnapshot, categoryOrder] = await Promise.all([
    listBranches(),
    listProducts(),
    firestoreRead(branchProductsRef(branchId).get(), `branches/${branchId}/products`),
    readCategoryOrder("getBranchAvailability"),
  ]);

  const branch = branches.find((b) => b.id === branchId);
  if (!branch) throw new ApiError(404, "unknown_branch", `No branch "${branchId}"`);

  const calendar = availabilityCalendar(branch, now);
  const option = (b: Branch) => ({ id: b.id, name: b.name });
  return {
    branch: option(branch),
    branches: owner ? branches.map(option) : [option(branch)],
    calendar,
    categories: buildAvailability({
      products,
      branchProducts: rowsSnapshot.docs.map(toBranchProduct),
      categoryOrder,
      today: calendar.today,
    }),
    hiddenCount: owner ? products.filter((product) => !product.isActive).length : null,
  };
}
