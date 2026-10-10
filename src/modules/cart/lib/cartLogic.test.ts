import { describe, expect, test } from "bun:test";
import type { BranchId, ProductId } from "@/shared/domain";
import { toIsoDate } from "@/shared/utils/pickup-dates";
import type { BranchMenu, MenuProduct } from "@/modules/menu/types/menu";
import type { Cart } from "../types/cart";
import {
  cartCount,
  cartLines,
  cartSummary,
  emptyCart,
  hasRemovals,
  MAX_QUANTITY,
  mergeCartOnSignIn,
  moveCart,
  previewBranchChange,
  previewRemovesItems,
  reconcileCart,
  removeItems,
  resolvePickupDate,
  setQuantity,
} from "./cartLogic";
import { parseStoredCart } from "./cartSchema";

const NORTHCOTE = "northcote" as BranchId;
const FITZROY = "fitzroy" as BranchId;
const WED = toIsoDate("2026-09-30");
const THU = toIsoDate("2026-10-01");
const FRI = toIsoDate("2026-10-02");
const MON = toIsoDate("2026-10-05");

const p = (id: string, name: string, priceCents: number, soldOut = false): MenuProduct => ({
  id: id as ProductId,
  name,
  description: "",
  priceCents,
  imageUrl: null,
  soldOut,
});

const RYE = p("rye", "Sourdough rye loaf", 950);
const BAGEL = p("bagel", "Plain bagel", 280);
const SEEDED = p("seeded", "Seeded sandwich loaf", 850);

const menu = (branchId: BranchId, date: typeof WED, products: MenuProduct[]): BranchMenu => ({
  branchId,
  date,
  categories: [{ name: "All", slug: "all", products }],
});

/** A Northcote cart for Wed with rye ×1 and bagel ×4, already checked. */
function checkedCart(): Cart {
  let cart = emptyCart(NORTHCOTE, WED);
  cart = setQuantity(cart, RYE, 1);
  cart = setQuantity(cart, BAGEL, 4);
  return reconcileCart(cart, menu(NORTHCOTE, WED, [RYE, BAGEL, SEEDED])).cart;
}

describe("setQuantity", () => {
  test("adds, changes and removes at 0", () => {
    let cart = emptyCart(NORTHCOTE, WED);
    cart = setQuantity(cart, RYE, 1);
    expect(cart.items[RYE.id]).toEqual({ quantity: 1, name: RYE.name });
    cart = setQuantity(cart, RYE, 3);
    expect(cart.items[RYE.id]?.quantity).toBe(3);
    cart = setQuantity(cart, RYE, 0);
    expect(cart.items[RYE.id]).toBeUndefined();
  });

  test("caps at the maximum and never goes negative", () => {
    const cart = emptyCart(NORTHCOTE, WED);
    expect(setQuantity(cart, RYE, 500).items[RYE.id]?.quantity).toBe(MAX_QUANTITY);
    expect(setQuantity(cart, RYE, -2).items[RYE.id]).toBeUndefined();
  });

  test("a sold-out product can't be added but can be taken out", () => {
    const soldOut = { ...RYE, soldOut: true };
    const empty = emptyCart(NORTHCOTE, WED);
    expect(setQuantity(empty, soldOut, 1)).toBe(empty);

    const withRye = setQuantity(empty, RYE, 2);
    expect(setQuantity(withRye, soldOut, 3)).toBe(withRye);
    expect(setQuantity(withRye, soldOut, 1).items[RYE.id]?.quantity).toBe(1);
    expect(setQuantity(withRye, soldOut, 0).items[RYE.id]).toBeUndefined();
  });

  test("no change returns the same cart object", () => {
    const cart = setQuantity(emptyCart(NORTHCOTE, WED), RYE, 2);
    expect(setQuantity(cart, RYE, 2)).toBe(cart);
  });
});

describe("cartCount and cartSummary", () => {
  test("count is every unit; total uses the menu's current prices", () => {
    const cart = checkedCart();
    expect(cartCount(cart)).toBe(5);
    expect(cartSummary(cart, menu(NORTHCOTE, WED, [RYE, BAGEL]))).toEqual({
      count: 5,
      totalCents: 950 + 4 * 280,
    });
    const newPrice = { ...BAGEL, priceCents: 300 };
    expect(cartSummary(cart, menu(NORTHCOTE, WED, [RYE, newPrice])).totalCents).toBe(950 + 1200);
  });

  test("items the menu can't sell are left out of the summary", () => {
    const cart = checkedCart();
    expect(cartSummary(cart, menu(NORTHCOTE, WED, [BAGEL]))).toEqual({ count: 4, totalCents: 1120 });
    expect(cartSummary(cart, menu(NORTHCOTE, WED, [RYE, { ...BAGEL, soldOut: true }])).count).toBe(1);
  });

  test("no cart or no menu is zero", () => {
    expect(cartCount(null)).toBe(0);
    expect(cartSummary(null, undefined)).toEqual({ count: 0, totalCents: 0 });
  });
});

describe("cartLines", () => {
  const twoCategories = (products: { breads: MenuProduct[]; bagels: MenuProduct[] }): BranchMenu => ({
    branchId: NORTHCOTE,
    date: WED,
    categories: [
      { name: "Breads", slug: "breads", products: products.breads },
      { name: "Bagels", slug: "bagels", products: products.bagels },
    ],
  });

  test("lines in menu order with the live price and line total", () => {
    // Added bagel first, rye second: the menu's order wins.
    let cart = setQuantity(emptyCart(NORTHCOTE, WED), BAGEL, 4);
    cart = setQuantity(cart, RYE, 2);
    const lines = cartLines(cart, twoCategories({ breads: [RYE, SEEDED], bagels: [BAGEL] }));
    expect(lines.map((l) => [l.product.id, l.quantity, l.lineTotalCents])).toEqual([
      [RYE.id, 2, 1900],
      [BAGEL.id, 4, 1120],
    ]);
  });

  test("a price change shows on the next menu", () => {
    const cart = checkedCart();
    const lines = cartLines(cart, menu(NORTHCOTE, WED, [{ ...RYE, priceCents: 1000 }, BAGEL]));
    expect(lines[0]).toMatchObject({ quantity: 1, lineTotalCents: 1000 });
  });

  test("missing and sold-out items have no line", () => {
    const lines = cartLines(checkedCart(), menu(NORTHCOTE, WED, [{ ...BAGEL, soldOut: true }]));
    expect(lines).toEqual([]);
  });

  test("no cart or no menu is no lines", () => {
    expect(cartLines(null, menu(NORTHCOTE, WED, [RYE]))).toEqual([]);
    expect(cartLines(checkedCart(), undefined)).toEqual([]);
  });
});

describe("previewBranchChange", () => {
  test("AC-C2: names what the new branch doesn't make, with quantities", () => {
    const preview = previewBranchChange(checkedCart(), menu(FITZROY, WED, [BAGEL, SEEDED]));
    expect(preview).toEqual({
      notMadeHere: [{ id: RYE.id, name: "Sourdough rye loaf", quantity: 1 }],
      soldOut: [],
    });
    expect(previewRemovesItems(preview)).toBe(true);
  });

  test("also names what the new branch has sold out that day", () => {
    const preview = previewBranchChange(checkedCart(), menu(FITZROY, WED, [{ ...BAGEL, soldOut: true }]));
    expect(preview.notMadeHere.map((l) => l.name)).toEqual(["Sourdough rye loaf"]);
    expect(preview.soldOut).toEqual([{ id: BAGEL.id, name: "Plain bagel", quantity: 4 }]);
  });

  test("nothing to take out", () => {
    const preview = previewBranchChange(checkedCart(), menu(FITZROY, WED, [RYE, BAGEL]));
    expect(previewRemovesItems(preview)).toBe(false);
  });

  test("agrees with the change itself, including a moved day", () => {
    // Fitzroy can't do Wed, so the cart would move to Thu, where bagels are sold out.
    const target = menu(FITZROY, THU, [{ ...BAGEL, soldOut: true }, SEEDED]);
    const preview = previewBranchChange(checkedCart(), target);
    const result = reconcileCart(moveCart(checkedCart(), { branchId: FITZROY, pickupDate: THU }), target);
    expect(result.removed.notMadeHere).toEqual(preview.notMadeHere.map((l) => l.name));
    expect(result.removed.soldOut).toEqual(preview.soldOut.map((l) => l.name));
    expect(result.removed.noLongerOffered).toEqual([]);
    expect(cartCount(result.cart)).toBe(0);
  });
});

describe("reconcileCart", () => {
  test("AC-C2: switching branch removes what the new branch doesn't make, by name", () => {
    const cart = moveCart(checkedCart(), { branchId: FITZROY, pickupDate: WED });
    const result = reconcileCart(cart, menu(FITZROY, WED, [BAGEL, SEEDED]));
    expect(result.removed).toEqual({
      notMadeHere: ["Sourdough rye loaf"],
      soldOut: [],
      noLongerOffered: [],
    });
    expect(Object.keys(result.cart.items)).toEqual([BAGEL.id]);
    expect(result.cart.checkedAgainst).toEqual({ branchId: FITZROY, pickupDate: WED });
  });

  test("AC-C3: changing date removes items sold out on the new date", () => {
    const cart = moveCart(checkedCart(), { branchId: NORTHCOTE, pickupDate: THU });
    const result = reconcileCart(cart, menu(NORTHCOTE, THU, [{ ...RYE, soldOut: true }, BAGEL]));
    expect(result.removed.soldOut).toEqual(["Sourdough rye loaf"]);
    expect(result.removed.notMadeHere).toEqual([]);
    expect(result.cart.items[RYE.id]).toBeUndefined();
    expect(result.cart.items[BAGEL.id]?.quantity).toBe(4);
  });

  test("branch and date change together: each item gets its own reason", () => {
    const cart = moveCart(checkedCart(), { branchId: FITZROY, pickupDate: FRI });
    const result = reconcileCart(cart, menu(FITZROY, FRI, [{ ...BAGEL, soldOut: true }]));
    expect(result.removed).toEqual({
      notMadeHere: ["Sourdough rye loaf"],
      soldOut: ["Plain bagel"],
      noLongerOffered: [],
    });
    expect(cartCount(result.cart)).toBe(0);
  });

  test("same branch, product gone from the menu: no longer offered, not 'not made here'", () => {
    const result = reconcileCart(checkedCart(), menu(NORTHCOTE, WED, [BAGEL]));
    expect(result.removed.noLongerOffered).toEqual(["Sourdough rye loaf"]);
    expect(result.removed.notMadeHere).toEqual([]);
  });

  test("a switch is still a switch after a reload before the menu arrived", () => {
    // The cart was moved and stored; the page reloads; the menu now loads.
    const stored = JSON.stringify(moveCart(checkedCart(), { branchId: FITZROY, pickupDate: WED }));
    const parsed = parseStoredCart(stored);
    if (!parsed.ok || !parsed.cart) throw new Error("expected a cart");
    expect(reconcileCart(parsed.cart, menu(FITZROY, WED, [BAGEL])).removed.notMadeHere).toEqual([
      "Sourdough rye loaf",
    ]);
  });

  test("nothing to change returns the same cart object", () => {
    const cart = checkedCart();
    const result = reconcileCart(cart, menu(NORTHCOTE, WED, [RYE, BAGEL]));
    expect(result.changed).toBe(false);
    expect(result.cart).toBe(cart);
    expect(hasRemovals(result.removed)).toBe(false);
  });

  test("a menu for another branch or date is ignored", () => {
    const cart = checkedCart();
    expect(reconcileCart(cart, menu(FITZROY, WED, [])).cart).toBe(cart);
    expect(reconcileCart(cart, menu(NORTHCOTE, THU, [])).cart).toBe(cart);
  });

  test("names are refreshed from the menu", () => {
    const renamed = { ...RYE, name: "Rye sourdough" };
    const result = reconcileCart(checkedCart(), menu(NORTHCOTE, WED, [renamed, BAGEL]));
    expect(result.changed).toBe(true);
    expect(result.cart.items[RYE.id]?.name).toBe("Rye sourdough");
    expect(hasRemovals(result.removed)).toBe(false);
  });

  test("an empty cart on a new place only records the check", () => {
    const result = reconcileCart(emptyCart(FITZROY, WED), menu(FITZROY, WED, [BAGEL]));
    expect(result.changed).toBe(true);
    expect(result.cart.checkedAgainst).toEqual({ branchId: FITZROY, pickupDate: WED });
    expect(hasRemovals(result.removed)).toBe(false);
  });
});

describe("moveCart", () => {
  test("no cart yet starts an empty one", () => {
    expect(moveCart(null, { branchId: NORTHCOTE, pickupDate: WED })).toEqual(emptyCart(NORTHCOTE, WED));
  });

  test("keeps the items until a menu checks them", () => {
    const moved = moveCart(checkedCart(), { branchId: FITZROY, pickupDate: THU });
    expect(cartCount(moved)).toBe(5);
    expect(moved.checkedAgainst).toEqual({ branchId: NORTHCOTE, pickupDate: WED });
  });

  test("same place returns the same object", () => {
    const cart = checkedCart();
    expect(moveCart(cart, { branchId: NORTHCOTE, pickupDate: WED })).toBe(cart);
  });
});

describe("resolvePickupDate", () => {
  const calendar = { earliest: THU, orderableDates: [THU, FRI] };

  test("URL date wins over the cart's", () => {
    expect(resolvePickupDate(FRI, THU, calendar)).toEqual({ date: FRI, movedFrom: null });
  });

  test("no URL date: the cart's", () => {
    expect(resolvePickupDate(null, FRI, calendar)).toEqual({ date: FRI, movedFrom: null });
  });

  test("neither: the earliest, nothing moved", () => {
    expect(resolvePickupDate(null, null, calendar)).toEqual({ date: THU, movedFrom: null });
  });

  test("a stored date whose cutoff passed overnight moves to the earliest", () => {
    expect(resolvePickupDate(null, WED, calendar)).toEqual({ date: THU, movedFrom: WED });
  });

  test("a closed day from an old link moves to the earliest", () => {
    expect(resolvePickupDate(MON, FRI, calendar)).toEqual({ date: THU, movedFrom: MON });
  });
});

describe("parseStoredCart", () => {
  test("nothing stored is no cart", () => {
    expect(parseStoredCart(null)).toEqual({ ok: true, cart: null });
  });

  test("round-trips a cart", () => {
    const cart = checkedCart();
    expect(parseStoredCart(JSON.stringify(cart))).toEqual({ ok: true, cart });
  });

  test("broken JSON, wrong version, bad date or bad quantity is rejected", () => {
    const good = checkedCart();
    expect(parseStoredCart("{not json").ok).toBe(false);
    expect(parseStoredCart(JSON.stringify({ ...good, version: 2 })).ok).toBe(false);
    expect(parseStoredCart(JSON.stringify({ ...good, pickupDate: "2026-02-30" })).ok).toBe(false);
    expect(
      parseStoredCart(JSON.stringify({ ...good, items: { rye: { quantity: 0, name: "Rye" } } })).ok,
    ).toBe(false);
  });
});

describe("removeItems", () => {
  const cart = setQuantity(setQuantity(emptyCart(NORTHCOTE, WED), RYE, 1), BAGEL, 4);

  test("takes out the named products and keeps the rest", () => {
    const result = removeItems(cart, [RYE.id]);
    expect(Object.keys(result.items)).toEqual([BAGEL.id]);
    expect(result.items[BAGEL.id]).toEqual({ quantity: 4, name: "Plain bagel" });
  });

  test("returns the same cart when none of them are in it", () => {
    expect(removeItems(cart, [SEEDED.id])).toBe(cart);
    expect(removeItems(cart, [])).toBe(cart);
  });
});

describe("mergeCartOnSignIn", () => {
  const product = (id: string, name: string) => ({ id: id as ProductId, name, soldOut: false });
  const rye = product("rye", "Rye loaf");
  const bagel = product("bagel", "Plain bagel");
  const scroll = product("scroll", "Cinnamon scroll");

  test("an empty or missing guest cart keeps the account's cart", () => {
    const account = setQuantity(emptyCart(FITZROY, THU), bagel, 6);
    expect(mergeCartOnSignIn(null, account)).toEqual({ cart: account, leftOut: [] });
    expect(mergeCartOnSignIn(emptyCart(NORTHCOTE, WED), account)).toEqual({ cart: account, leftOut: [] });
  });

  test("an empty or missing account cart takes the guest cart as it is", () => {
    const guest = setQuantity(emptyCart(NORTHCOTE, WED), rye, 2);
    expect(mergeCartOnSignIn(guest, null)).toEqual({ cart: guest, leftOut: [] });
    expect(mergeCartOnSignIn(guest, emptyCart(FITZROY, THU))).toEqual({ cart: guest, leftOut: [] });
  });

  test("nothing anywhere stays nothing", () => {
    expect(mergeCartOnSignIn(null, null)).toEqual({ cart: null, leftOut: [] });
  });

  test("same branch and day: lines combine, quantities add up", () => {
    const guest = setQuantity(setQuantity(emptyCart(NORTHCOTE, WED), rye, 2), bagel, 1);
    const account = setQuantity(setQuantity(emptyCart(NORTHCOTE, WED), bagel, 6), scroll, 3);
    const { cart, leftOut } = mergeCartOnSignIn(guest, account);
    expect(leftOut).toEqual([]);
    expect(cart?.branchId).toBe(NORTHCOTE);
    expect(cart?.pickupDate).toBe(WED);
    expect(cart?.items).toEqual({
      rye: { name: "Rye loaf", quantity: 2 },
      bagel: { name: "Plain bagel", quantity: 7 },
      scroll: { name: "Cinnamon scroll", quantity: 3 },
    });
  });

  test("combined quantities stop at the maximum", () => {
    const guest = setQuantity(emptyCart(NORTHCOTE, WED), bagel, 60);
    const account = setQuantity(emptyCart(NORTHCOTE, WED), bagel, 60);
    expect(mergeCartOnSignIn(guest, account).cart?.items.bagel?.quantity).toBe(MAX_QUANTITY);
  });

  test("another branch: the guest cart wins and the account's items are named", () => {
    const guest = setQuantity(emptyCart(NORTHCOTE, WED), rye, 2);
    const account = setQuantity(setQuantity(emptyCart(FITZROY, WED), bagel, 6), scroll, 1);
    const result = mergeCartOnSignIn(guest, account);
    expect(result.cart).toBe(guest);
    expect([...result.leftOut].sort()).toEqual(["Cinnamon scroll", "Plain bagel"]);
  });

  test("same branch, another day: the guest cart wins and the account's items are named", () => {
    const guest = setQuantity(emptyCart(NORTHCOTE, WED), rye, 2);
    const account = setQuantity(emptyCart(NORTHCOTE, FRI), bagel, 6);
    expect(mergeCartOnSignIn(guest, account)).toEqual({ cart: guest, leftOut: ["Plain bagel"] });
  });
});
