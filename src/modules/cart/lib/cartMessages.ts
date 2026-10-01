// Messages about what just changed in the cart ("We took X out…"). Kept in
// memory beside the cart, not stored: they belong to the menu of the branch
// that caused them, and a message for another branch replaces them.

interface CartMessages {
  branchId: string | null;
  list: readonly string[];
}

const NONE: CartMessages = { branchId: null, list: [] };
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

/** Adds a message for a branch's menu once; the same sentence twice shows once. */
export function pushCartMessage(branchId: string, message: string): void {
  const list = messages.branchId === branchId ? messages.list : [];
  if (!list.includes(message)) set({ branchId, list: [...list, message] });
}

export function clearCartMessages(): void {
  if (messages.list.length > 0) set(NONE);
}

/** The messages to show on this branch's menu. */
export function messagesFor(snapshot: CartMessages, branchId: string): readonly string[] {
  return snapshot.branchId === branchId ? snapshot.list : NONE.list;
}
