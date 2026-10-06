import { after } from "next/server";
import { applyPaymentEvent } from "@/modules/orders/lib/payment/applyPaymentEvent";
import { sendOrderConfirmation } from "@/modules/orders/lib/sendOrderConfirmation";
import { ApiError } from "@/shared/lib/api/apiError";
import { jsonResponse, routeHandler } from "@/shared/lib/api/routeHandler";
import { InvalidWebhookError } from "@/shared/lib/payments/paymentProvider";
import { paymentProvider } from "@/shared/lib/payments/paymentsConfig";
import { logError } from "@/shared/utils/logError";

// Stripe's webhook (spec 6: trust the webhook, not the redirect). No session
// and no rate limit: the signature is the credential, and a limit would drop
// Stripe's retries. proxy.ts never runs on /api.
// 200 applied, a duplicate or ignored (unknown type or order); 400 missing or
// bad signature; 503 payments switched off or Firestore too slow, so Stripe
// sends it again later.
export const POST = routeHandler("POST /api/webhooks/stripe", async (request) => {
  const provider = paymentProvider();
  if (!provider) throw new ApiError(503, "unavailable", "Online payment is switched off; retry later");

  // The signature covers the exact bytes, so read the body as text before anything parses it.
  const rawBody = await request.text();
  let event;
  try {
    event = await provider.parseWebhook(rawBody, request.headers.get("stripe-signature"));
  } catch (error) {
    if (error instanceof InvalidWebhookError) {
      logError(error, "POST /api/webhooks/stripe: refused", { level: "warn" });
      throw new ApiError(400, "invalid_signature", "Webhook signature didn't verify");
    }
    throw error;
  }

  if (event.kind === "ignored") {
    console.info(`[payments] ignored ${event.type} ${event.eventId}: ${event.reason}`);
    return jsonResponse({ received: true });
  }

  const { confirmation } = await applyPaymentEvent(event, new Date());
  if (confirmation) after(() => sendOrderConfirmation(confirmation));
  return jsonResponse({ received: true });
});
