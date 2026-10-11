// C11 saves, then C12 says so ("Your recurring order is set up…"). The
// message crosses one client-side navigation, so it's held here, in memory
// only: a reload or a direct visit shows no stale message.

let pending: { recurringOrderId: string; message: string } | null = null;

export function setRecurringFlash(recurringOrderId: string, message: string): void {
  pending = { recurringOrderId, message };
}

/** The message waiting for this recurring order, without taking it (safe to call while rendering). */
export function peekRecurringFlash(recurringOrderId: string): string | null {
  return pending?.recurringOrderId === recurringOrderId ? pending.message : null;
}

export function clearRecurringFlash(recurringOrderId: string): void {
  if (pending?.recurringOrderId === recurringOrderId) pending = null;
}
