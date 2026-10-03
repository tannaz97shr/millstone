import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DevEmailView } from "@/modules/dev-emails/components/DevEmailView";
import { devEmailsContent, EMAIL_PREVIEW_WIDTHS } from "@/modules/dev-emails/content/devEmails";
import { readDevEmail } from "@/shared/lib/email/devEmailStore";

export const metadata: Metadata = {
  title: devEmailsContent.metadataTitle,
};

// Gated by app/dev/layout.tsx. An ID that isn't a saved email (or isn't
// shaped like one) is a 404; readDevEmail never reads outside the outbox.
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ emailId: string }>;
  searchParams: Promise<{ width?: string }>;
}) {
  const [{ emailId }, { width }] = await Promise.all([params, searchParams]);
  const email = await readDevEmail(emailId);
  if (!email) notFound();
  const frameWidth =
    Number(width) === EMAIL_PREVIEW_WIDTHS.desktop ? EMAIL_PREVIEW_WIDTHS.desktop : EMAIL_PREVIEW_WIDTHS.phone;
  return <DevEmailView email={email} width={frameWidth} />;
}
