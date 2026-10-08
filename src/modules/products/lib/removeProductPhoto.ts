import "server-only";
import { productToDoc, toProduct } from "@/modules/catalog/lib/toProduct";
import type { Product, ProductId, ProductImage } from "@/shared/domain";
import { getDb } from "@/shared/lib/firebase/admin";
import { productsRef } from "@/shared/lib/firebase/collections";
import { deleteStoredFile } from "@/shared/lib/firebase/storage";
import type { AdminProduct } from "../types/adminProduct";
import { switchedOffAtFor, toAdminProduct } from "./listAdminProducts";
import { productChanged, productNotFound, withSaveDeadline } from "./saveProduct";

/**
 * Takes a product's photo away, so menus show its letter again (undesigned):
 * 1. save the product without its image, in a transaction (version checked)
 * 2. only then delete the stored file
 * A product with no photo comes back as it is. A failed delete is logged,
 * never thrown: an orphaned file is better than a product pointing at nothing.
 */
export async function removeProductPhoto(productId: ProductId, expectedVersion: number): Promise<AdminProduct> {
  const ref = productsRef().doc(productId);
  const { saved, previous } = await withSaveDeadline(
    getDb().runTransaction(async (tx): Promise<{ saved: Product; previous: ProductImage | null }> => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists) throw productNotFound();
      const current = toProduct(snapshot);
      if (current.version !== expectedVersion) throw productChanged(current.version);
      if (!current.image) return { saved: current, previous: null };
      const next: Product = { ...current, image: null, version: current.version + 1 };
      tx.set(ref, productToDoc(next));
      return { saved: next, previous: current.image };
    }),
  );

  if (previous) await deleteStoredFile(previous.path, "removed");
  return toAdminProduct(saved, await switchedOffAtFor(saved.id));
}
