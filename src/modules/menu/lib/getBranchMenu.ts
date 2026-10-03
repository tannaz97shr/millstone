import "server-only";
import { assertOrderableDate } from "@/modules/branches/lib/assertOrderableDate";
import { getBranchOrThrow } from "@/modules/branches/lib/listBranches";
import { toBranchProduct } from "@/modules/catalog/lib/toBranchProduct";
import { toCatalogSettings } from "@/modules/catalog/lib/toCatalogSettings";
import { toProduct } from "@/modules/catalog/lib/toProduct";
import type { BranchId, IsoDate } from "@/shared/domain";
import {
  branchProductsRef,
  catalogSettingsRef,
  productsRef,
} from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { logError } from "@/shared/utils/logError";
import type { BranchMenu } from "../types/menu";
import { buildMenu } from "./buildMenu";

async function readCategoryOrder(): Promise<string[]> {
  const snapshot = await firestoreRead(catalogSettingsRef().get(), "settings/catalog");
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

  assertOrderableDate(branch, date, now);

  const [productsSnapshot, branchProductsSnapshot, categoryOrder] = await Promise.all([
    firestoreRead(productsRef().where("isActive", "==", true).get(), "active products"),
    firestoreRead(branchProductsRef(branchId).get(), `branches/${branchId}/products`),
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
