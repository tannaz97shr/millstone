import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { Product, ProductId } from "@/shared/domain";
import { parseDoc } from "@/shared/lib/firebase/parseDoc";
import type { ProductDoc } from "../types/catalogDocs";
import { productDocSchema } from "./productSchema";

export function toProduct(snapshot: DocumentSnapshot): Product {
  const doc = parseDoc(productDocSchema, snapshot);
  return {
    id: snapshot.id as ProductId,
    name: doc.name,
    description: doc.description,
    category: doc.category,
    priceCents: doc.priceCents,
    image: doc.image ? { path: doc.image.path, url: doc.image.url } : null,
    isActive: doc.isActive,
    version: doc.version,
  };
}

export function productToDoc(product: Omit<Product, "id">): ProductDoc {
  return {
    name: product.name,
    description: product.description,
    category: product.category,
    priceCents: product.priceCents,
    image: product.image ? { path: product.image.path, url: product.image.url } : null,
    isActive: product.isActive,
    version: product.version,
  };
}
