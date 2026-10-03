import type { BranchProduct, Cents, IsoDate, OrderItem, Product, ProductId } from "@/shared/domain";
import type { UnavailableItem } from "@/shared/lib/api/apiError";
import { isSoldOut } from "@/shared/utils/pickup-dates";

// Prices a checkout from current catalog data (AC-C8). Pure: the caller reads
// the products and the branch's rows; nothing here touches Firestore.

export interface RequestedItem {
  productId: ProductId;
  quantity: number;
}

export interface PriceOrderInput {
  date: IsoDate;
  items: readonly RequestedItem[];
  /** Current products by ID; a missing entry is a product that no longer exists. */
  products: ReadonlyMap<ProductId, Product>;
  /** The branch's rows by product ID; a missing entry means available (the default). */
  branchProducts: ReadonlyMap<ProductId, BranchProduct>;
}

export type PricedOrder =
  | { ok: true; items: OrderItem[]; totalCents: Cents }
  | { ok: false; unavailable: UnavailableItem[] };

/**
 * Every line priced from the product's current price, with its name and unit
 * price snapshotted. Any item the branch can't sell that day makes the whole
 * order unavailable, naming each one: not on the branch's menu (missing,
 * inactive or switched off there), or sold out for the date.
 */
export function priceOrder({ date, items, products, branchProducts }: PriceOrderInput): PricedOrder {
  const unavailable: UnavailableItem[] = [];
  const priced: OrderItem[] = [];

  for (const { productId, quantity } of items) {
    const product = products.get(productId);
    const row = branchProducts.get(productId);
    if (!product || !product.isActive || (row && !row.isAvailable)) {
      unavailable.push({ productId, name: product?.name ?? productId, reason: "not_available" });
    } else if (row && isSoldOut(row, date)) {
      unavailable.push({ productId, name: product.name, reason: "sold_out" });
    } else {
      priced.push({
        productId,
        productName: product.name,
        unitPriceCents: product.priceCents,
        quantity,
        lineTotalCents: product.priceCents * quantity,
      });
    }
  }

  if (unavailable.length > 0) return { ok: false, unavailable };
  return { ok: true, items: priced, totalCents: priced.reduce((sum, item) => sum + item.lineTotalCents, 0) };
}
