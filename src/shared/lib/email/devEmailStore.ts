import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { logError } from "@/shared/utils/logError";
import type { EmailMessage } from "./emailMessage";

// Development's outbox: each email is a JSON file in the gitignored
// .dev-emails folder, listed and shown by /dev/emails.

const OUTBOX = path.join(process.cwd(), ".dev-emails");

/** e.g. "1759450000000-a1b2c3". Checked before any file read, so a URL can't reach outside the folder. */
const EMAIL_ID = /^\d{13}-[0-9a-f]{6}$/;

const storedEmailSchema = z.object({
  to: z.string(),
  fromName: z.string(),
  subject: z.string(),
  preheader: z.string(),
  html: z.string(),
  text: z.string(),
  sentAt: z.string(),
});

export type StoredEmail = z.infer<typeof storedEmailSchema> & { id: string };
export type StoredEmailSummary = Pick<StoredEmail, "id" | "to" | "subject" | "sentAt">;

export async function saveDevEmail(message: EmailMessage, now: Date): Promise<string> {
  const id = `${now.getTime()}-${randomBytes(3).toString("hex")}`;
  await mkdir(OUTBOX, { recursive: true });
  const stored: z.input<typeof storedEmailSchema> = { ...message, sentAt: now.toISOString() };
  await writeFile(path.join(OUTBOX, `${id}.json`), JSON.stringify(stored, null, 2));
  return id;
}

export async function readDevEmail(id: string): Promise<StoredEmail | null> {
  if (!EMAIL_ID.test(id)) return null;
  let raw: string;
  try {
    raw = await readFile(path.join(OUTBOX, `${id}.json`), "utf8");
  } catch (error) {
    logError(error, `readDevEmail ${id}`, { level: "warn" });
    return null;
  }
  const result = storedEmailSchema.safeParse(JSON.parse(raw));
  if (!result.success) {
    logError(result.error, `readDevEmail ${id}: unreadable file`, { level: "warn" });
    return null;
  }
  return { id, ...result.data };
}

/** Newest first. An empty or missing folder is an empty list. */
export async function listDevEmails(): Promise<StoredEmailSummary[]> {
  let files: string[];
  try {
    files = await readdir(OUTBOX);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const ids = files
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.slice(0, -".json".length))
    .filter((id) => EMAIL_ID.test(id))
    .sort()
    .reverse();
  const emails = await Promise.all(ids.map(readDevEmail));
  return emails.flatMap((email) =>
    email ? [{ id: email.id, to: email.to, subject: email.subject, sentAt: email.sentAt }] : [],
  );
}
