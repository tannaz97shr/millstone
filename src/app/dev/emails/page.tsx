import type { Metadata } from "next";
import { connection } from "next/server";
import { DevEmailList } from "@/modules/dev-emails/components/DevEmailList";
import { devEmailsContent } from "@/modules/dev-emails/content/devEmails";
import { listDevEmails } from "@/shared/lib/email/devEmailStore";

export const metadata: Metadata = {
  title: devEmailsContent.metadataTitle,
};

// Gated by app/dev/layout.tsx. Read per request: the outbox changes as orders come in.
export default async function Page() {
  await connection();
  return <DevEmailList emails={await listDevEmails()} />;
}
