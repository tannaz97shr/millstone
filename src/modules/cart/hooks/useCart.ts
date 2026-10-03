"use client";

import { useSyncExternalStore } from "react";
import {
  clearCartProblem,
  getCartServerSnapshot,
  getCartSnapshot,
  subscribeToCart,
  type CartState,
} from "../lib/cartStorage";

export { updateCart } from "../lib/cartStorage";

/**
 * The stored cart. `status: "loading"` on the server and during hydration, so
 * nothing that depends on localStorage renders until the browser has read it.
 */
export function useCart(): CartState {
  return useSyncExternalStore<CartState>(subscribeToCart, getCartSnapshot, getCartServerSnapshot);
}

export const dismissCartProblem = clearCartProblem;
