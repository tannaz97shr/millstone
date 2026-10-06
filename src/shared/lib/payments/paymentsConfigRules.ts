// Whether online payment is on, decided from the environment. Pure (it takes
// the env as an argument), so every rule is unit-tested; paymentsConfig.ts
// reads process.env and logs.

export type PaymentsEnv = Readonly<Record<string, string | undefined>>;

export type PaymentsConfig =
  | {
      enabled: true;
      secretKey: string;
      webhookSecret: string;
      /** No trailing slash, e.g. "https://millstone-two.vercel.app". */
      siteUrl: string;
      /** Always true for now: live keys are refused until the provider is decided (spec 12). */
      testMode: boolean;
    }
  | {
      enabled: false;
      /** Names variables only, never their values. Null when the switch is simply off. */
      problem: string | null;
    };

const TEST_KEY = /^(sk|rk)_test_/;
const LIVE_KEY = /^(sk|rk)_live_/;

/** A live Stripe secret or restricted key (refused for now). */
export const isLiveSecretKey = (key: string | undefined): boolean => LIVE_KEY.test(key?.trim() ?? "");

const present = (value: string | undefined): value is string => value !== undefined && value.trim() !== "";

/** SITE_URL, else Vercel's production domain. Never the request's Host header. */
export function siteUrlFrom(env: PaymentsEnv): string | null {
  const explicit = env.SITE_URL?.trim();
  if (explicit) {
    if (!URL.canParse(explicit)) return null;
    const url = new URL(explicit);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  }
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return vercel ? `https://${vercel}` : null;
}

export function readPaymentsConfig(env: PaymentsEnv): PaymentsConfig {
  if (env.ONLINE_PAYMENTS_ENABLED !== "true") return { enabled: false, problem: null };

  const missing = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"].filter((name) => !present(env[name]));
  const siteUrl = siteUrlFrom(env);
  if (!siteUrl) missing.push(present(env.SITE_URL) ? "SITE_URL (not a URL)" : "SITE_URL");
  if (missing.length > 0) {
    return { enabled: false, problem: `ONLINE_PAYMENTS_ENABLED is true but ${missing.join(", ")} is missing` };
  }

  const secretKey = (env.STRIPE_SECRET_KEY as string).trim();
  if (LIVE_KEY.test(secretKey)) {
    return { enabled: false, problem: "STRIPE_SECRET_KEY is a live key; only test keys are allowed for now" };
  }
  if (!TEST_KEY.test(secretKey)) {
    return { enabled: false, problem: "STRIPE_SECRET_KEY isn't a Stripe secret or restricted test key" };
  }

  return {
    enabled: true,
    secretKey,
    webhookSecret: (env.STRIPE_WEBHOOK_SECRET as string).trim(),
    siteUrl: siteUrl as string,
    testMode: true,
  };
}

const PAYMENT_INTENT_ID = /^pi_[A-Za-z0-9]+$/;

/**
 * Where staff can see one payment in Stripe's dashboard (A3). Null for a
 * reference that isn't a PaymentIntent ID, such as the seed's "PAY-…" ones,
 * so A3 never links to a page that doesn't exist.
 */
export function stripeDashboardPaymentUrl(paymentRef: string | null, testMode: boolean): string | null {
  if (!paymentRef || !PAYMENT_INTENT_ID.test(paymentRef)) return null;
  const base = testMode ? "https://dashboard.stripe.com/test/payments/" : "https://dashboard.stripe.com/payments/";
  return base + paymentRef;
}
