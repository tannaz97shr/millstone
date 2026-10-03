import "server-only";

/**
 * C5's "Pay online now" option. Off unless the server-only env var
 * ONLINE_PAYMENTS_ENABLED is "true"; the payment-provider step turns it on.
 */
export function onlinePaymentsEnabled(): boolean {
  return process.env.ONLINE_PAYMENTS_ENABLED === "true";
}
