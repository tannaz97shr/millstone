// Messages about what just changed in the cart ("We took X out…"). Kept in
// memory beside the cart, not stored. Each belongs to one screen and branch
// (its scope): a message for another scope replaces them, so C4's notices
// don't show again on C2, and C2's don't repeat on C4.

interface CartMessages {
  scope: string | null;
  list: readonly string[];
}

/** Where a message shows: the menu (C2) or the cart (C4), for one branch. */
export const cartMessageScope = {
  menu: (branchId: string) => `menu:${branchId}`,
  cart: (branchId: string) => `cart:${branchId}`,
} as const;

const NONE: CartMessages = { scope: null, list: [] };
const listeners = new Set<() => void>();
let messages: CartMessages = NONE;

function set(next: CartMessages) {
  messages = next;
  for (const listener of listeners) listener();
}

export function subscribeToCartMessages(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getCartMessages = () => messages;
export const getCartMessagesServerSnapshot = () => NONE;

/** Adds a message for a scope once; the same sentence twice shows once. */
export function pushCartMessage(scope: string, message: string): void {
  const list = messages.scope === scope ? messages.list : [];
  if (!list.includes(message)) set({ scope, list: [...list, message] });
}

export function clearCartMessages(): void {
  if (messages.list.length > 0) set(NONE);
}

/** The messages to show in this scope. */
export function messagesFor(snapshot: CartMessages, scope: string): readonly string[] {
  return snapshot.scope === scope ? snapshot.list : NONE.list;
}
