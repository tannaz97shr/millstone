import "server-only";
import { devPagesEnabled } from "@/shared/utils/devPages";
import { logError } from "@/shared/utils/logError";
import { saveDevEmail } from "./devEmailStore";
import type { EmailMessage } from "./emailMessage";

// The one way the app sends email. No provider is chosen yet: in development
// (and builds with DEV_PAGES=true) emails are logged and saved for /dev/emails;
// anywhere else they are logged as unsent.

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (devPagesEnabled()) {
    const id = await saveDevEmail(message, new Date());
    console.info(`[email] "${message.subject}" to ${message.to}, saved as ${id} (see /dev/emails)`);
    return;
  }
  logError(new Error(`No email provider configured; "${message.subject}" was not sent`), "sendEmail", {
    level: "warn",
  });
}
