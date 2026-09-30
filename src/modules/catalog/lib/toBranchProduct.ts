import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { BranchId, BranchProduct, ProductId } from "@/shared/domain";
import { parseDoc } from "@/shared/lib/firebase/parseDoc";
import type { BranchProductDoc } from "../types/catalogDocs";
import { branchProductDocSchema } from "./branchProductSchema";

export function toBranchProduct(snapshot: DocumentSnapshot): BranchProduct {
  const doc = parseDoc(branchProductDocSchema, snapshot);
  return {
    branchId: doc.branchId as BranchId,
    productId: doc.productId as ProductId,
    isAvailable: doc.isAvailable,
    soldOutOn: doc.soldOutOn,
  };
}

/** What a branch's row looks like when no doc exists: on the menu, not sold out. */
export function defaultBranchProduct(branchId: BranchId, productId: ProductId): BranchProduct {
  return { branchId, productId, isAvailable: true, soldOutOn: null };
}

export function branchProductToDoc(branchProduct: BranchProduct): BranchProductDoc {
  return {
    branchId: branchProduct.branchId,
    productId: branchProduct.productId,
    isAvailable: branchProduct.isAvailable,
    soldOutOn: branchProduct.soldOutOn,
  };
}
