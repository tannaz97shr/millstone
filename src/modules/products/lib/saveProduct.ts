import "server-only";
import type { Transaction } from "firebase-admin/firestore";
import { catalogSettingsToDoc, toCatalogSettings } from "@/modules/catalog/lib/toCatalogSettings";
import { productToDoc, toProduct } from "@/modules/catalog/lib/toProduct";
import type { Product, ProductId } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { getDb } from "@/shared/lib/firebase/admin";
import { catalogSettingsRef, productsRef } from "@/shared/lib/firebase/collections";
import { withDeadline } from "@/shared/utils/withDeadline";
import type { AdminProduct } from "../types/adminProduct";
import { switchedOffAtFor, toAdminProduct } from "./listAdminProducts";
import { normaliseCategory, slugCandidates } from "./productFields";
import type { ProductInput } from "./productSchemas";

/** As for order actions: a transaction can retry on contention. */
export const PRODUCT_SAVE_DEADLINE_MS = 8_000;

export const productNotFound = () => new ApiError(404, "not_found", "No such product");

export const productChanged = (currentVersion: number) =>
  new ApiError(409, "product_changed", "Saved on another screen since the form read it", { currentVersion });

export function withSaveDeadline<T>(transaction: Promise<T>): Promise<T> {
  // A commit that lands after the deadline did happen: the list's refetch shows
  // it, and a second save gets "changed on another screen".
  return withDeadline(
    transaction,
    PRODUCT_SAVE_DEADLINE_MS,
    () => new ApiError(503, "unavailable", `Product save took over ${PRODUCT_SAVE_DEADLINE_MS}ms`),
  );
}

/**
 * Reads settings/catalog in the transaction, matches the category to an
 * existing one (ignoring case), and returns a write that appends it when
 * it's new (AC-P1). Call before any other write in the transaction.
 */
async function categoryFor(tx: Transaction, typed: string): Promise<{ category: string; append: () => void }> {
  const snapshot = await tx.get(catalogSettingsRef());
  const order = snapshot.exists ? toCatalogSettings(snapshot).categoryOrder : [];
  const category = normaliseCategory(typed, order);
  return {
    category,
    append: () => {
      if (!order.includes(category)) {
        tx.set(catalogSettingsRef(), catalogSettingsToDoc({ categoryOrder: [...order, category] }));
      }
    },
  };
}

/**
 * A new product (AC-P1). Its ID is a slug of the name, created with
 * `create()` so a clash fails instead of overwriting. No branch rows are
 * written: a missing row means on the menu, so it's at every branch (spec 4).
 */
export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  const product = await withSaveDeadline(
    getDb().runTransaction(async (tx) => {
      const { category, append } = await categoryFor(tx, input.category);
      let id: ProductId | null = null;
      for (const candidate of slugCandidates(input.name)) {
        if (!(await tx.get(productsRef().doc(candidate))).exists) {
          id = candidate as ProductId;
          break;
        }
      }
      if (!id) throw new ApiError(409, "not_allowed", "Too many products with this name already");

      const created: Product = { id, ...input, category, image: null, version: 0 };
      tx.create(productsRef().doc(id), productToDoc(created));
      append();
      return created;
    }),
  );
  return toAdminProduct(product, []);
}

/**
 * Saves the form's fields (AC-P1 to P3) if nobody saved the product since the
 * form read it (`expectedVersion`). Hiding is `isActive: false`; it can be
 * shown again the same way. Orders keep their own snapshot of name and price.
 */
export async function updateProduct(
  productId: ProductId,
  input: ProductInput,
  expectedVersion: number,
): Promise<AdminProduct> {
  const ref = productsRef().doc(productId);
  const product = await withSaveDeadline(
    getDb().runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists) throw productNotFound();
      const current = toProduct(snapshot);
      if (current.version !== expectedVersion) throw productChanged(current.version);

      const { category, append } = await categoryFor(tx, input.category);
      const saved: Product = { ...current, ...input, category, version: current.version + 1 };
      tx.set(ref, productToDoc(saved));
      append();
      return saved;
    }),
  );
  return toAdminProduct(product, await switchedOffAtFor(product.id));
}
