import { describe, expect, test } from "bun:test";
import { readPaymentsConfig, siteUrlFrom, stripeDashboardPaymentUrl } from "./paymentsConfigRules";

// Placeholder values only; never real keys.
const env = {
  ONLINE_PAYMENTS_ENABLED: "true",
  STRIPE_SECRET_KEY: "sk_test_placeholder",
  STRIPE_WEBHOOK_SECRET: "whsec_placeholder",
  SITE_URL: "http://localhost:3000",
};

describe("readPaymentsConfig", () => {
  test("on with a test key, a webhook secret and a site URL", () => {
    expect(readPaymentsConfig(env)).toEqual({
      enabled: true,
      secretKey: "sk_test_placeholder",
      webhookSecret: "whsec_placeholder",
      siteUrl: "http://localhost:3000",
      testMode: true,
    });
    expect(readPaymentsConfig({ ...env, STRIPE_SECRET_KEY: "rk_test_placeholder" }).enabled).toBe(true);
  });

  test("off, quietly, unless the switch is exactly \"true\"", () => {
    expect(readPaymentsConfig({ ...env, ONLINE_PAYMENTS_ENABLED: undefined })).toEqual({ enabled: false, problem: null });
    expect(readPaymentsConfig({ ...env, ONLINE_PAYMENTS_ENABLED: "false" })).toEqual({ enabled: false, problem: null });
    expect(readPaymentsConfig({ ...env, ONLINE_PAYMENTS_ENABLED: "TRUE" })).toEqual({ enabled: false, problem: null });
  });

  test("off, naming what's missing (never a value)", () => {
    const config = readPaymentsConfig({ ...env, STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: undefined });
    expect(config.enabled).toBe(false);
    if (config.enabled) return;
    expect(config.problem).toContain("STRIPE_SECRET_KEY");
    expect(config.problem).toContain("STRIPE_WEBHOOK_SECRET");
  });

  test("off for a live key, or anything that isn't a secret test key", () => {
    for (const key of ["sk_live_placeholder", "rk_live_placeholder", "pk_test_placeholder", "nonsense"]) {
      const config = readPaymentsConfig({ ...env, STRIPE_SECRET_KEY: key });
      expect(config.enabled).toBe(false);
      if (!config.enabled) expect(config.problem).not.toContain(key);
    }
  });

  test("off with no usable site URL", () => {
    expect(readPaymentsConfig({ ...env, SITE_URL: undefined }).enabled).toBe(false);
    expect(readPaymentsConfig({ ...env, SITE_URL: "not a url" }).enabled).toBe(false);
  });
});

describe("siteUrlFrom", () => {
  test("SITE_URL's origin, else Vercel's production domain", () => {
    expect(siteUrlFrom({ SITE_URL: "https://millstone.example.com/some/path/" })).toBe("https://millstone.example.com");
    expect(siteUrlFrom({ VERCEL_PROJECT_PRODUCTION_URL: "millstone-two.vercel.app" })).toBe(
      "https://millstone-two.vercel.app",
    );
    expect(siteUrlFrom({ SITE_URL: "ftp://example.com" })).toBeNull();
    expect(siteUrlFrom({})).toBeNull();
  });
});

describe("stripeDashboardPaymentUrl", () => {
  test("test and live dashboards", () => {
    expect(stripeDashboardPaymentUrl("pi_123", true)).toBe("https://dashboard.stripe.com/test/payments/pi_123");
    expect(stripeDashboardPaymentUrl("pi_123", false)).toBe("https://dashboard.stripe.com/payments/pi_123");
  });

  test("no link for anything but a PaymentIntent ID", () => {
    for (const ref of [null, "", "PAY-7Q2M81", "cs_test_123", "pi_", "pi_123/../../settings", "pi_1 2"]) {
      expect(stripeDashboardPaymentUrl(ref, true)).toBeNull();
    }
  });
});
