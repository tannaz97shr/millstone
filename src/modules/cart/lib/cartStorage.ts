import { logError } from "@/shared/utils/logError";
import type { Cart } from "../types/cart";
import { mergeCartOnSignIn } from "./cartLogic";
import { parseStoredCart } from "./cartSchema";

// The cart lives in localStorage, one key per user: `millstone:cart:guest`,
// or `millstone:cart:{customerId}` while a customer is signed in. The owner
// is set from the session as each page renders (StorageOwner). Reads and
// writes only ever run in the browser.

const KEY_PREFIX = "millstone:cart:";
export const GUEST_CART_OWNER = "guest";
export const cartStorageKey = (owner: string = GUEST_CART_OWNER) => `${KEY_PREFIX}${owner}`;

/** corrupt: the stored cart couldn't be read. unavailable: storage refused a read or write. */
export type CartStorageProblem = "corrupt" | "unavailable";

export interface CartSnapshot {
  status: "ready";
  cart: Cart | null;
  problem: CartStorageProblem | null;
}

/** Before hydration (and on the server) the cart is unknown. */
export const CART_NOT_LOADED = { status: "loading" } as const;
export type CartState = CartSnapshot | typeof CART_NOT_LOADED;

let owner: string = GUEST_CART_OWNER;
const listeners = new Set<() => void>();
let snapshot: CartSnapshot | null = null;

/** Whose cart (and checkout draft) this browser is using now: a customer ID, or "guest". */
export const getStorageOwner = () => owner;

/** Reads one owner's stored cart, or null if there's none or it can't be read (left in place). */
function peekCart(storageKey: string): Cart | null {
  try {
    const parsed = parseStoredCart(window.localStorage.getItem(storageKey));
    return parsed.ok ? parsed.cart : null;
  } catch (error) {
    logError(error, "cartStorage.peek", { level: "warn" });
    return null;
  }
}

/** The saved account items a sign-in left out, until a screen says so (SignInCartNotice). */
export interface SignInLeftOut {
  /** The kept (guest) cart's branch, whose cart message scope shows it. */
  branchId: string;
  names: string[];
}

let signInLeftOut: SignInLeftOut | null = null;

/** Takes what the last sign-in left out of the cart, once. */
export function takeSignInLeftOut(): SignInLeftOut | null {
  const taken = signInLeftOut;
  signInLeftOut = null;
  return taken;
}

/**
 * Signing in carries the guest cart over to the account (mergeCartOnSignIn)
 * and empties the guest one. Failures only cost the carry-over.
 */
function carryGuestCartTo(accountKey: string) {
  const guestKey = cartStorageKey(GUEST_CART_OWNER);
  const { cart, leftOut } = mergeCartOnSignIn(peekCart(guestKey), peekCart(accountKey));
  try {
    if (cart) window.localStorage.setItem(accountKey, JSON.stringify(cart));
    window.localStorage.removeItem(guestKey);
    if (cart && leftOut.length > 0) signInLeftOut = { branchId: cart.branchId, names: leftOut };
  } catch (error) {
    logError(error, "cartStorage.carryGuestCart", { level: "warn" });
  }
}

/**
 * Switches the cart to `next`'s (the signed-in customer's ID, or "guest").
 * Called while rendering, before anything reads the cart, so the first
 * snapshot is already the right owner's. Listeners hear about it afterwards,
 * never during that render. Does nothing on the server.
 */
export function setStorageOwner(next: string): void {
  if (typeof window === "undefined" || next === owner) return;
  const previous = owner;
  owner = next;
  if (previous === GUEST_CART_OWNER) carryGuestCartTo(cartStorageKey(next));
  snapshot = null;
  if (listeners.size > 0) queueMicrotask(notify);
}

function notify() {
  for (const listener of listeners) listener();
}

function load(): CartSnapshot {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(cartStorageKey(owner));
  } catch (error) {
    logError(error, "cartStorage.load", { level: "warn" });
    return { status: "ready", cart: null, problem: "unavailable" };
  }
  const parsed = parseStoredCart(raw);
  if (parsed.ok) return { status: "ready", cart: parsed.cart, problem: null };

  logError(parsed.error, "cartStorage.load: stored cart discarded", { level: "warn" });
  try {
    window.localStorage.removeItem(cartStorageKey(owner));
  } catch (error) {
    logError(error, "cartStorage.load: remove", { level: "warn" });
  }
  return { status: "ready", cart: null, problem: "corrupt" };
}

export function getCartSnapshot(): CartSnapshot {
  snapshot ??= load();
  return snapshot;
}

export function getCartServerSnapshot(): CartState {
  return CART_NOT_LOADED;
}

/** Another tab changed the cart. */
function onStorage(event: StorageEvent) {
  if (event.key !== cartStorageKey(owner) && event.key !== null) return;
  snapshot = load();
  notify();
}

export function subscribeToCart(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/**
 * Saves the cart (null clears it). If storage refuses, the cart is kept in
 * memory for this page and the problem is reported, so the screen can say so.
 */
export function writeCart(cart: Cart | null): void {
  const current = getCartSnapshot();
  if (current.cart === cart) return;
  let problem: CartStorageProblem | null = current.problem === "corrupt" ? "corrupt" : null;
  try {
    if (cart) window.localStorage.setItem(cartStorageKey(owner), JSON.stringify(cart));
    else window.localStorage.removeItem(cartStorageKey(owner));
  } catch (error) {
    logError(error, "cartStorage.write", { level: "warn" });
    problem = "unavailable";
  }
  snapshot = { status: "ready", cart, problem };
  notify();
}

/**
 * Reads the latest stored cart, applies `change` and saves the result.
 * Event handlers and effects use this instead of a cart from a render, so
 * they never act on a stale copy.
 */
export function updateCart(change: (cart: Cart | null) => Cart | null): Cart | null {
  const next = change(getCartSnapshot().cart);
  writeCart(next);
  return next;
}

export function clearCartProblem(): void {
  const current = getCartSnapshot();
  if (!current.problem) return;
  snapshot = { ...current, problem: null };
  notify();
}
