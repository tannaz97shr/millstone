import type { Cents, IsoInstant, OrderId } from "@/shared/domain";

// The payment provider behind a small adapter (CLAUDE.md: Square vs Stripe
// isn't decided). Orders code only sees these shapes; stripe/ is the first
// implementation.

export interface CheckoutLine {
  name: string;
  unitPriceCents: Cents;
  quantity: number;
}

/** Everything the provider's page needs, all taken from the stored order. */
export interface CheckoutRequest {
  orderId: OrderId;
  orderNumber: string;
  branchName: string;
  contactEmail: string;
  lines: CheckoutLine[];
  totalCents: Cents;
  expiresAt: IsoInstant;
  successUrl: string;
  cancelUrl: string;
  /**
   * Makes a repeat of the same request return the same page instead of a
   * second one. The checkout key, so a retried Place order can't open two.
   */
  idempotencyKey: string;
}

export type CheckoutState = "open" | "complete" | "expired";

export interface CheckoutPage {
  sessionId: string;
  /** Null once the page is no longer open. */
  url: string | null;
  state: CheckoutState;
}

/** A verified provider event, reduced to what orders care about. */
export type PaymentEvent =
  | {
      kind: "paid";
      eventId: string;
      orderId: OrderId;
      sessionId: string;
      /** The provider's payment ID, shown to staff (A3). */
      paymentRef: string;
      amountCents: Cents;
      /** Lowercase ISO code, e.g. "aud". */
      currency: string;
    }
  | { kind: "expired"; eventId: string; orderId: OrderId; sessionId: string }
  /** Verified, but nothing for orders to do (another type, or no order ID). */
  | { kind: "ignored"; eventId: string; type: string; reason: string };

export interface PaymentProvider {
  createCheckout(request: CheckoutRequest): Promise<CheckoutPage>;
  /** Closes a page that's still open, so it can't be paid. Already closed is fine. */
  expireCheckout(sessionId: string): Promise<void>;
  /** Verifies the signature on the raw body; throws InvalidWebhookError if it doesn't match. */
  parseWebhook(rawBody: string, signature: string | null): Promise<PaymentEvent>;
}

/** A webhook whose signature is missing, wrong or too old (400). */
export class InvalidWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidWebhookError";
  }
}

/** The provider couldn't be reached or refused the request (C5: 503 payment_unavailable). */
export class PaymentProviderError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PaymentProviderError";
  }
}

/** The currency every Millstone order is charged in. */
export const ORDER_CURRENCY = "aud";
