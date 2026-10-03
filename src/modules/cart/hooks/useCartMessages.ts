"use client";

import { useSyncExternalStore } from "react";
import {
  getCartMessages,
  getCartMessagesServerSnapshot,
  messagesFor,
  subscribeToCartMessages,
} from "../lib/cartMessages";

export { cartMessageScope, clearCartMessages, pushCartMessage } from "../lib/cartMessages";

/** What just changed in the cart in this scope (see cartMessageScope), as sentences for a Notice. */
export function useCartMessages(scope: string): readonly string[] {
  const snapshot = useSyncExternalStore(
    subscribeToCartMessages,
    getCartMessages,
    getCartMessagesServerSnapshot,
  );
  return messagesFor(snapshot, scope);
}
