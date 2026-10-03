import "server-only";
import type { Product } from "@/shared/domain";
import { productsRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { toProduct } from "./toProduct";

/** Every product in the shared catalogue, active or not, A–Z. */
export async function listProducts(): Promise<Product[]> {
  const snapshot = await firestoreRead(productsRef().get(), "products");
  return snapshot.docs.map(toProduct).sort((a, b) => a.name.localeCompare(b.name));
}
