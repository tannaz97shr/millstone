import "server-only";
import Stripe from "stripe";
import { logError } from "@/shared/utils/logError";
import {
  type CheckoutPage,
  type CheckoutRequest,
  type CheckoutState,
  InvalidWebhookError,
  ORDER_CURRENCY,
  type PaymentProvider,
  PaymentProviderError,
} from "../paymentProvider";
import { toPaymentEvent } from "./stripeEvents";

// Stripe Checkout (hosted page), the first provider. The client is created on
// first use, so a build without keys never needs them.

/** stripe-node 23's own version, pinned so a library upgrade never changes the API quietly. */
const API_VERSION = "2026-09-30.endive";

/**
 * Each Stripe call gets 6s and one retry, so C5's request stays within its
 * timeout. Retries carry the idempotency key, so they can't make a second page.
 */
const STRIPE_TIMEOUT_MS = 6_000;

function toCheckoutState(status: Stripe.Checkout.Session["status"]): CheckoutState {
  if (status === "complete") return "complete";
  if (status === "open") return "open";
  return "expired";
}

function toCheckoutPage(session: Stripe.Checkout.Session): CheckoutPage {
  const state = toCheckoutState(session.status);
  return { sessionId: session.id, url: state === "open" ? session.url : null, state };
}

export function createStripeProvider(config: {
  secretKey: string;
  webhookSecret: string;
  testMode: boolean;
}): PaymentProvider {
  const stripe = new Stripe(config.secretKey, {
    apiVersion: API_VERSION,
    maxNetworkRetries: 1,
    timeout: STRIPE_TIMEOUT_MS,
    appInfo: { name: "millstone" },
  });

  return {
    async createCheckout(request: CheckoutRequest): Promise<CheckoutPage> {
      const metadata = { orderId: request.orderId, orderNumber: request.orderNumber };
      try {
        const session = await stripe.checkout.sessions.create(
          {
            mode: "payment",
            ui_mode: "hosted_page",
            allowed_payment_method_types: ["card"],
            line_items: request.lines.map((line) => ({
              quantity: line.quantity,
              price_data: {
                currency: ORDER_CURRENCY,
                unit_amount: line.unitPriceCents,
                product_data: { name: line.name },
              },
            })),
            client_reference_id: request.orderId,
            metadata,
            payment_intent_data: {
              description: `Millstone ${request.branchName} order ${request.orderNumber}`,
              metadata,
            },
            customer_email: request.contactEmail,
            expires_at: Math.floor(Date.parse(request.expiresAt) / 1000),
            success_url: request.successUrl,
            cancel_url: request.cancelUrl,
          },
          { idempotencyKey: request.idempotencyKey },
        );
        const page = toCheckoutPage(session);
        if (session.amount_total !== request.totalCents) {
          // Never expected: the lines are the order's own snapshot. Logged, not refused.
          logError(
            new Error(`Session ${session.id} totals ${session.amount_total}, order ${request.orderNumber} ${request.totalCents}`),
            "stripe.createCheckout",
          );
        }
        return page;
      } catch (error) {
        throw new PaymentProviderError(`Stripe couldn't create a Checkout Session for ${request.orderNumber}`, {
          cause: error,
        });
      }
    },

    async expireCheckout(sessionId: string): Promise<void> {
      try {
        await stripe.checkout.sessions.expire(sessionId);
      } catch (error) {
        // Already complete or expired: nothing left to close.
        if (error instanceof Stripe.errors.StripeInvalidRequestError) {
          logError(error, `stripe.expireCheckout ${sessionId}: not open`, { level: "warn" });
          return;
        }
        throw new PaymentProviderError(`Stripe couldn't expire ${sessionId}`, { cause: error });
      }
    },

    async parseWebhook(rawBody: string, signature: string | null) {
      if (!signature) throw new InvalidWebhookError("No stripe-signature header");
      let event: Stripe.Event;
      try {
        event = await stripe.webhooks.constructEventAsync(rawBody, signature, config.webhookSecret);
      } catch (error) {
        if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
          throw new InvalidWebhookError(error.message);
        }
        throw error;
      }
      return toPaymentEvent(event, !config.testMode);
    },
  };
}
