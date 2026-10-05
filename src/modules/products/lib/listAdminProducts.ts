import "server-only";
import { listBranches } from "@/modules/branches/lib/listBranches";
import { listProducts } from "@/modules/catalog/lib/listProducts";
import { readCategoryOrder } from "@/modules/catalog/lib/readCategoryOrder";
import { toBranchProduct } from "@/modules/catalog/lib/toBranchProduct";
import { sortCategories } from "@/modules/menu/lib/buildMenu";
import type { Branch, Product, ProductId } from "@/shared/domain";
import { branchProductsRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import type { AdminProduct, AdminProductsResponse } from "../types/adminProduct";

export function toAdminProduct(product: Product, offAt: string[]): AdminProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    priceCents: product.priceCents,
    imageUrl: product.image?.url ?? null,
    isActive: product.isActive,
    version: product.version,
    offAt,
  };
}

/** For each product, the names of the branches that switched it off (C1's order). */
async function switchedOffAt(branches: readonly Branch[]): Promise<Map<ProductId, string[]>> {
  const snapshots = await Promise.all(
    branches.map((branch) =>
      firestoreRead(branchProductsRef(branch.id).where("isAvailable", "==", false).get(), `branches/${branch.id}/products off`),
    ),
  );
  const offAt = new Map<ProductId, string[]>();
  snapshots.forEach((snapshot, index) => {
    for (const row of snapshot.docs.map(toBranchProduct)) {
      offAt.set(row.productId, [...(offAt.get(row.productId) ?? []), branches[index].name]);
    }
  });
  return offAt;
}

/** One product's branches that switched it off, for the answer to a save. */
export async function switchedOffAtFor(productId: ProductId): Promise<string[]> {
  const branches = await listBranches();
  const rows = await Promise.all(
    branches.map((branch) => firestoreRead(branchProductsRef(branch.id).doc(productId).get(), `branches/${branch.id}/products/${productId}`)),
  );
  return branches.filter((_, i) => rows[i].exists && !toBranchProduct(rows[i]).isAvailable).map((b) => b.name);
}

/** A5's list (GET /api/admin/products, and the page's prefetch). Owner only: the route checks. */
export async function listAdminProducts(): Promise<AdminProductsResponse> {
  const [products, branches, categoryOrder] = await Promise.all([
    listProducts(),
    listBranches(),
    readCategoryOrder("listAdminProducts"),
  ]);
  const offAt = await switchedOffAt(branches);
  return {
    products: products.map((product) => toAdminProduct(product, offAt.get(product.id) ?? [])),
    categories: sortCategories([...categoryOrder, ...products.map((p) => p.category)], categoryOrder),
    branchCount: branches.length,
  };
}
