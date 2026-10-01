"use client";

import { useSyncExternalStore } from "react";
import {
  getCartMessages,
  getCartMessagesServerSnapshot,
  messagesFor,
  subscribeToCartMessages,
} from "../lib/cartMessages";

export { clearCartMessages, pushCartMessage } from "../lib/cartMessages";

/** What just changed in the cart on this branch's menu, as sentences for a Notice. */
export function useCartMessages(branchId: string): readonly string[] {
  const snapshot = useSyncExternalStore(
    subscribeToCartMessages,
    getCartMessages,
    getCartMessagesServerSnapshot,
  );
  return messagesFor(snapshot, branchId);
}
