import "server-only";
import { randomUUID } from "node:crypto";
import { productToDoc, toProduct } from "@/modules/catalog/lib/toProduct";
import type { Product, ProductId, ProductImage } from "@/shared/domain";
import { getDb } from "@/shared/lib/firebase/admin";
import { productsRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { deleteStoredFile, uploadImage } from "@/shared/lib/firebase/storage";
import { logError } from "@/shared/utils/logError";
import type { AdminProduct } from "../types/adminProduct";
import { switchedOffAtFor, toAdminProduct } from "./listAdminProducts";
import { PHOTO_CONTENT_TYPE, processPhoto } from "./processPhoto";
import { productChanged, productNotFound, withSaveDeadline } from "./saveProduct";

/** products/{productId}/{random}.webp: built here only, from the stored product's ID. */
function photoPath(productId: ProductId): string {
  return `products/${productId}/${randomUUID()}.webp`;
}

/**
 * After a failed save, removes the new file unless the save did land (a
 * transaction can commit after its caller gave up). If that can't be checked,
 * the file stays: an orphan is better than a product pointing at nothing.
 */
async function removeUnlessSaved(productId: ProductId, path: string): Promise<void> {
  try {
    const snapshot = await firestoreRead(productsRef().doc(productId).get(), `products/${productId}`);
    if (snapshot.exists && toProduct(snapshot).image?.path === path) return;
  } catch (error) {
    logError(error, `setProductPhoto: couldn't confirm ${path} is unused; keeping it`, { level: "warn" });
    return;
  }
  await deleteStoredFile(path, "photo save failed");
}

/**
 * A new photo for a product, in this order:
 * 1. check the product exists at the version the form read (before any work)
 * 2. check and convert the bytes (processPhoto: 415, 413 or 422)
 * 3. upload under a new path
 * 4. save the product in a transaction (version checked again)
 * 5. only then delete the old file
 * If step 4 fails, the new file is deleted, so nothing is left orphaned.
 * A failed delete is logged, never thrown.
 */
export async function setProductPhoto(
  requestedId: ProductId,
  bytes: Uint8Array,
  expectedVersion: number,
): Promise<AdminProduct> {
  const before = await firestoreRead(productsRef().doc(requestedId).get(), `products/${requestedId}`);
  if (!before.exists) throw productNotFound();
  const productId = before.id as ProductId;
  const found = toProduct(before);
  if (found.version !== expectedVersion) throw productChanged(found.version);

  const webp = await processPhoto(bytes);
  const image = await uploadImage(photoPath(productId), webp, PHOTO_CONTENT_TYPE);

  let saved: Product;
  let previous: ProductImage | null;
  try {
    ({ saved, previous } = await withSaveDeadline(getDb().runTransaction(async (tx) => {
      const ref = productsRef().doc(productId);
      const snapshot = await tx.get(ref);
      if (!snapshot.exists) throw productNotFound();
      const current = toProduct(snapshot);
      if (current.version !== expectedVersion) throw productChanged(current.version);
      const next: Product = { ...current, image, version: current.version + 1 };
      tx.set(ref, productToDoc(next));
      return { saved: next, previous: current.image };
    })));
  } catch (error) {
    await removeUnlessSaved(productId, image.path);
    throw error;
  }

  if (previous && previous.path !== image.path) await deleteStoredFile(previous.path, "replaced");
  return toAdminProduct(saved, await switchedOffAtFor(productId));
}
