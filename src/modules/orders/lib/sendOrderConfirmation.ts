import "server-only";
import { sendEmail } from "@/shared/lib/email/sendEmail";
import { logError } from "@/shared/utils/logError";
import type { OrderConfirmation } from "../types/orderConfirmation";
import { buildConfirmationEmail } from "./email/buildConfirmationEmail";

/**
 * Emails the confirmation (AC-C9, C11). Runs after the order is saved; a
 * failure is logged and never undoes or fails the order.
 */
export async function sendOrderConfirmation(order: OrderConfirmation): Promise<void> {
  try {
    await sendEmail({ to: order.contactEmail, ...buildConfirmationEmail(order) });
  } catch (error) {
    logError(error, `sendOrderConfirmation ${order.orderNumber}`);
  }
}
