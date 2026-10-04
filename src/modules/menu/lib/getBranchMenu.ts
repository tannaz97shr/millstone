import "server-only";
import { assertOrderableDate } from "@/modules/branches/lib/assertOrderableDate";
import { getBranchOrThrow } from "@/modules/branches/lib/listBranches";
import { readCategoryOrder } from "@/modules/catalog/lib/readCategoryOrder";
import { toBranchProduct } from "@/modules/catalog/lib/toBranchProduct";
import { toProduct } from "@/modules/catalog/lib/toProduct";
import type { BranchId, IsoDate } from "@/shared/domain";
import { branchProductsRef, productsRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import type { BranchMenu } from "../types/menu";
import { buildMenu } from "./buildMenu";

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
    readCategoryOrder("getBranchMenu"),
  ]);

  return buildMenu({
    branchId,
    date,
    products: productsSnapshot.docs.map(toProduct),
    branchProducts: branchProductsSnapshot.docs.map(toBranchProduct),
    categoryOrder,
  });
}
