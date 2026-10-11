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

export type PricedLine = { ok: true; item: OrderItem } | { ok: false; unavailable: UnavailableItem };

/**
 * One line against the branch's menu for the date: priced from the product's
 * current price, with its name and unit price snapshotted, or unavailable
 * because it isn't on the branch's menu (missing, inactive or switched off
 * there) or is sold out for the date. Checkout and recurring generation share it.
 */
export function priceLine(
  { productId, quantity }: RequestedItem,
  date: IsoDate,
  products: PriceOrderInput["products"],
  branchProducts: PriceOrderInput["branchProducts"],
): PricedLine {
  const product = products.get(productId);
  const row = branchProducts.get(productId);
  if (!product || !product.isActive || (row && !row.isAvailable)) {
    return { ok: false, unavailable: { productId, name: product?.name ?? productId, reason: "not_available" } };
  }
  if (row && isSoldOut(row, date)) {
    return { ok: false, unavailable: { productId, name: product.name, reason: "sold_out" } };
  }
  return {
    ok: true,
    item: {
      productId,
      productName: product.name,
      unitPriceCents: product.priceCents,
      quantity,
      lineTotalCents: product.priceCents * quantity,
    },
  };
}

export const totalOf = (items: readonly OrderItem[]): Cents =>
  items.reduce((sum, item) => sum + item.lineTotalCents, 0);

/**
 * Every line priced with priceLine. Any item the branch can't sell that day
 * makes the whole order unavailable, naming each one.
 */
export function priceOrder({ date, items, products, branchProducts }: PriceOrderInput): PricedOrder {
  const unavailable: UnavailableItem[] = [];
  const priced: OrderItem[] = [];

  for (const requested of items) {
    const line = priceLine(requested, date, products, branchProducts);
    if (line.ok) priced.push(line.item);
    else unavailable.push(line.unavailable);
  }

  if (unavailable.length > 0) return { ok: false, unavailable };
  return { ok: true, items: priced, totalCents: totalOf(priced) };
}
