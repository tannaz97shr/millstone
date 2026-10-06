import "server-only";
import type { PaymentProvider } from "./paymentProvider";
import { type PaymentsConfig, readPaymentsConfig } from "./paymentsConfigRules";
import { createStripeProvider } from "./stripe/stripeProvider";

// Server-only: Stripe's keys never reach the browser (no NEXT_PUBLIC_*). Read
// once per server; a misconfiguration is logged once, by variable name only.

let config: PaymentsConfig | null = null;

export function paymentsConfig(): PaymentsConfig {
  if (!config) {
    config = readPaymentsConfig(process.env);
    if (!config.enabled && config.problem) console.warn(`[payments] off: ${config.problem}`);
  }
  return config;
}

/**
 * C5's "Pay online now". On only when ONLINE_PAYMENTS_ENABLED is "true" and
 * Stripe's test keys and the site URL are all set.
 */
export function onlinePaymentsEnabled(): boolean {
  return paymentsConfig().enabled;
}

let provider: PaymentProvider | null = null;

/** The configured provider, or null while online payment is off. */
export function paymentProvider(): PaymentProvider | null {
  const current = paymentsConfig();
  if (!current.enabled) return null;
  provider ??= createStripeProvider(current);
  return provider;
}

/** The site's own origin, for the provider's return URLs; null while online payment is off. */
export function paymentsSiteUrl(): string | null {
  const current = paymentsConfig();
  return current.enabled ? current.siteUrl : null;
}

/** True when payments run on Stripe's test keys: C5 says no real money moves. */
export function paymentsTestMode(): boolean {
  const current = paymentsConfig();
  return current.enabled && current.testMode;
}
