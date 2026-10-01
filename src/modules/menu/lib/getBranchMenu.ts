import "server-only";
import { getBranchOrThrow } from "@/modules/branches/lib/listBranches";
import { toBranchProduct } from "@/modules/catalog/lib/toBranchProduct";
import { toCatalogSettings } from "@/modules/catalog/lib/toCatalogSettings";
import { toProduct } from "@/modules/catalog/lib/toProduct";
import type { BranchId, IsoDate } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import {
  branchProductsRef,
  catalogSettingsRef,
  productsRef,
} from "@/shared/lib/firebase/collections";
import { logError } from "@/shared/utils/logError";
import { pickupCalendar, pickupDateProblem } from "@/shared/utils/pickup-dates";
import type { BranchMenu } from "../types/menu";
import { buildMenu } from "./buildMenu";

const DATE_MESSAGES = {
  closed_day: "The branch is closed that day",
  past_cutoff: "Orders for that day have closed",
  out_of_range: "That day is too far ahead to order",
} as const;

async function readCategoryOrder(): Promise<string[]> {
  const snapshot = await catalogSettingsRef().get();
  if (!snapshot.exists) {
    logError(new Error("settings/catalog is missing; categories fall back to A–Z"), "getBranchMenu", {
      level: "warn",
    });
    return [];
  }
  return toCatalogSettings(snapshot).categoryOrder;
}

/**
 * One branch's menu for one pickup date (GET /api/branches/{id}/menu, and the
 * server prefetch for the same query). Throws a 404 ApiError for an unknown
 * branch and a 422 for a date that can't be ordered with the server's clock.
 */
export async function getBranchMenu(branchId: BranchId, date: IsoDate, now: Date): Promise<BranchMenu> {
  const branch = await getBranchOrThrow(branchId);

  const calendar = pickupCalendar(branch, now);
  const problem = pickupDateProblem(calendar, date);
  if (problem) {
    throw new ApiError(422, problem, DATE_MESSAGES[problem], { earliest: calendar.earliest });
  }

  const [productsSnapshot, branchProductsSnapshot, categoryOrder] = await Promise.all([
    productsRef().where("isActive", "==", true).get(),
    branchProductsRef(branchId).get(),
    readCategoryOrder(),
  ]);

  return buildMenu({
    branchId,
    date,
    products: productsSnapshot.docs.map(toProduct),
    branchProducts: branchProductsSnapshot.docs.map(toBranchProduct),
    categoryOrder,
  });
}
