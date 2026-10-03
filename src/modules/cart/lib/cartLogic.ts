import type { BranchId, Cents, IsoDate, ProductId } from "@/shared/domain";
import type { PickupCalendar } from "@/shared/utils/pickup-dates";
import type { BranchMenu, MenuProduct } from "@/modules/menu/types/menu";
import type { Cart, CartLine, CartPlace, CartRemovals } from "../types/cart";

// Pure cart rules. Nothing here reads localStorage, the clock or the network.

export const MAX_QUANTITY = 99;

export function emptyCart(branchId: BranchId, pickupDate: IsoDate): Cart {
  return { version: 1, branchId, pickupDate, items: {}, checkedAgainst: null };
}

const samePlace = (a: CartPlace | null, b: CartPlace | null) =>
  a !== null && b !== null && a.branchId === b.branchId && a.pickupDate === b.pickupDate;

/** Points the cart at a branch and date, keeping its items until a menu checks them. */
export function moveCart(cart: Cart | null, place: CartPlace): Cart {
  if (!cart) return emptyCart(place.branchId, place.pickupDate);
  if (samePlace(cart, place)) return cart;
  return { ...cart, branchId: place.branchId, pickupDate: place.pickupDate };
}

export function lineEntries(cart: Cart): [ProductId, CartLine][] {
  return Object.entries(cart.items).filter(
    (entry): entry is [ProductId, CartLine] => entry[1] !== undefined,
  );
}

export function quantityOf(cart: Cart | null, productId: ProductId): number {
  return cart?.items[productId]?.quantity ?? 0;
}

/**
 * Sets a product's quantity. 0 removes it; the count is capped at
 * MAX_QUANTITY. A sold-out product can be reduced or removed, never added.
 */
export function setQuantity(
  cart: Cart,
  product: Pick<MenuProduct, "id" | "name" | "soldOut">,
  quantity: number,
): Cart {
  const current = quantityOf(cart, product.id);
  const next = Math.max(0, Math.min(MAX_QUANTITY, Math.floor(quantity)));
  if (Number.isNaN(next) || next === current) return cart;
  if (product.soldOut && next > current) return cart;

  const items = { ...cart.items };
  if (next === 0) delete items[product.id];
  else items[product.id] = { quantity: next, name: product.name };
  return { ...cart, items };
}

export function cartCount(cart: Cart | null): number {
  if (!cart) return 0;
  return lineEntries(cart).reduce((sum, [, line]) => sum + line.quantity, 0);
}

export function menuProducts(menu: BranchMenu): Map<ProductId, MenuProduct> {
  return new Map(menu.categories.flatMap((c) => c.products.map((p) => [p.id, p] as const)));
}

export interface CartLineView {
  product: MenuProduct;
  quantity: number;
  lineTotalCents: Cents;
}

/**
 * The cart's lines priced from the live menu, in menu order. Items the menu
 * can't sell (missing or sold out) are left out until a check removes them.
 */
export function cartLines(cart: Cart | null, menu: BranchMenu | undefined): CartLineView[] {
  if (!cart || !menu) return [];
  return menu.categories.flatMap((category) =>
    category.products.flatMap((product) => {
      const quantity = quantityOf(cart, product.id);
      if (quantity === 0 || product.soldOut) return [];
      return [{ product, quantity, lineTotalCents: quantity * product.priceCents }];
    }),
  );
}

/** Count and total from the live menu's prices. Items the menu can't sell are left out. */
export function cartSummary(cart: Cart | null, menu: BranchMenu | undefined) {
  let count = 0;
  let totalCents: Cents = 0;
  for (const line of cartLines(cart, menu)) {
    count += line.quantity;
    totalCents += line.lineTotalCents;
  }
  return { count, totalCents };
}

export interface ReconcileResult {
  cart: Cart;
  removed: CartRemovals;
  /** False when the cart came back as the same object. */
  changed: boolean;
}

export const hasRemovals = (removed: CartRemovals) =>
  removed.notMadeHere.length + removed.soldOut.length + removed.noLongerOffered.length > 0;

/**
 * Checks the cart against the menu for its branch and date (AC-C2, AC-C3).
 * Items the menu doesn't have are removed: as "not made here" when the
 * branch changed since the last check, otherwise as "no longer offered".
 * Items sold out for the date are removed too. Names are refreshed from the
 * menu. A menu for a different branch or date than the cart's changes nothing.
 */
export function reconcileCart(cart: Cart, menu: BranchMenu): ReconcileResult {
  const removed: CartRemovals = { notMadeHere: [], soldOut: [], noLongerOffered: [] };
  if (menu.branchId !== cart.branchId || menu.date !== cart.pickupDate) {
    return { cart, removed, changed: false };
  }

  const products = menuProducts(menu);
  const branchChanged =
    cart.checkedAgainst !== null && cart.checkedAgainst.branchId !== cart.branchId;
  const items: Cart["items"] = {};
  let itemsChanged = false;

  for (const [id, line] of lineEntries(cart)) {
    const product = products.get(id);
    if (!product) {
      (branchChanged ? removed.notMadeHere : removed.noLongerOffered).push(line.name);
      itemsChanged = true;
    } else if (product.soldOut) {
      removed.soldOut.push(product.name);
      itemsChanged = true;
    } else {
      items[id] = { quantity: line.quantity, name: product.name };
      if (product.name !== line.name) itemsChanged = true;
    }
  }

  const place: CartPlace = { branchId: cart.branchId, pickupDate: cart.pickupDate };
  if (!itemsChanged && samePlace(cart.checkedAgainst, place)) {
    return { cart, removed, changed: false };
  }
  return { cart: { ...cart, items, checkedAgainst: place }, removed, changed: true };
}

export interface RemovedLine {
  id: ProductId;
  name: string;
  quantity: number;
}

export interface BranchChangePreview {
  /** Lines the new branch doesn't make. */
  notMadeHere: RemovedLine[];
  /** Lines the new branch makes but has sold out on the (new) pickup date. */
  soldOut: RemovedLine[];
}

/**
 * What a branch change would take out of the cart (AC-C2), worked out against
 * the new branch's menu for the date the cart would move to. Agrees with
 * reconcileCart(moveCart(cart, place), menu), which makes the change.
 */
export function previewBranchChange(cart: Cart, targetMenu: BranchMenu): BranchChangePreview {
  const products = menuProducts(targetMenu);
  const preview: BranchChangePreview = { notMadeHere: [], soldOut: [] };
  for (const [id, line] of lineEntries(cart)) {
    const product = products.get(id);
    if (!product) preview.notMadeHere.push({ id, name: line.name, quantity: line.quantity });
    else if (product.soldOut) preview.soldOut.push({ id, name: product.name, quantity: line.quantity });
  }
  return preview;
}

export const previewRemovesItems = (preview: BranchChangePreview) =>
  preview.notMadeHere.length + preview.soldOut.length > 0;

export interface ResolvedPickupDate {
  date: IsoDate;
  /** The date the customer had, when it can no longer be ordered. */
  movedFrom: IsoDate | null;
}

/**
 * The menu's pickup date: the URL's, else the cart's, else the earliest.
 * A date the server's calendar can't take (closed, past the cutoff, too far
 * ahead) moves to the earliest date, and says which date it was.
 */
export function resolvePickupDate(
  urlDate: IsoDate | null,
  cartDate: IsoDate | null,
  calendar: Pick<PickupCalendar, "earliest" | "orderableDates">,
): ResolvedPickupDate {
  const wanted = urlDate ?? cartDate;
  if (wanted === null) return { date: calendar.earliest, movedFrom: null };
  if (calendar.orderableDates.includes(wanted)) return { date: wanted, movedFrom: null };
  return { date: calendar.earliest, movedFrom: wanted };
}
