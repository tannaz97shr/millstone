import type { Cents, ProductId } from "./ids";

export interface ProductImage {
  /** Object path in Firebase Storage. */
  path: string;
  /** Token-gated download URL. */
  url: string;
}

export interface Product {
  id: ProductId;
  name: string;
  description: string;
  /** Display name, e.g. "Breads". Owners can type a new one. */
  category: string;
  priceCents: Cents;
  /** Null until a real photo exists; the UI shows the first letter instead. */
  image: ProductImage | null;
  isActive: boolean;
}
