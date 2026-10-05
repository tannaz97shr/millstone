import "server-only";
import { devPagesEnabled } from "@/shared/utils/devPages";
import { saveDevEmail } from "./devEmailStore";
import type { EmailMessage } from "./emailMessage";

// The one way the app sends email. No provider is chosen yet: in development
// (and local builds with DEV_PAGES=true) emails are logged and saved for
// /dev/emails. Anywhere else, the live site included, email is off: one log
// line, never the address, and nothing is sent.

/** Whether an email sent now reaches anyone (today, only the dev outbox). C7 says so either way. */
export function emailDeliveryEnabled(): boolean {
  return devPagesEnabled();
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!emailDeliveryEnabled()) {
    console.info(`[email] off: "${message.subject}" not sent (no provider)`);
    return;
  }
  const id = await saveDevEmail(message, new Date());
  console.info(`[email] "${message.subject}" to ${message.to}, saved as ${id} (see /dev/emails)`);
}
