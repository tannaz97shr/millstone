import Link from "next/link";
import type { StoredEmailSummary } from "@/shared/lib/email/devEmailStore";
import { routes } from "@/shared/routes";
import { devEmailsContent as content } from "../content/devEmails";

const timeFormat = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  dateStyle: "medium",
  timeStyle: "medium",
});

export function DevEmailList({ emails }: { emails: StoredEmailSummary[] }) {
  return (
    <main className="mx-auto flex w-full max-w-200 flex-col gap-8 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="page-title">{content.title}</h1>
        <p className="text-ink-muted">{content.intro}</p>
      </header>
      {emails.length === 0 ? (
        <p>{content.empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-flour-raised">
          {emails.map((email) => (
            <li key={email.id} className="flex flex-col gap-1 p-4">
              <Link href={routes.dev.email(email.id)} className="body-strong">
                {email.subject}
              </Link>
              <span className="caption text-ink-muted">
                {content.to(email.to)} · {content.sentAt(timeFormat.format(new Date(email.sentAt)))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
