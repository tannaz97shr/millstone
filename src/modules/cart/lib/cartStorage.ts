import { logError } from "@/shared/utils/logError";
import type { Cart } from "../types/cart";
import { parseStoredCart } from "./cartSchema";

// The cart lives in localStorage, one key per user. Accounts come later, so
// everyone is the guest for now. Browser only: never imported on the server.

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

const key = cartStorageKey();
const listeners = new Set<() => void>();
let snapshot: CartSnapshot | null = null;

function notify() {
  for (const listener of listeners) listener();
}

function load(): CartSnapshot {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch (error) {
    logError(error, "cartStorage.load", { level: "warn" });
    return { status: "ready", cart: null, problem: "unavailable" };
  }
  const parsed = parseStoredCart(raw);
  if (parsed.ok) return { status: "ready", cart: parsed.cart, problem: null };

  logError(parsed.error, "cartStorage.load: stored cart discarded", { level: "warn" });
  try {
    window.localStorage.removeItem(key);
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
  if (event.key !== key && event.key !== null) return;
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
    if (cart) window.localStorage.setItem(key, JSON.stringify(cart));
    else window.localStorage.removeItem(key);
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
