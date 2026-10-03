import Link from "next/link";
import type { StoredEmail } from "@/shared/lib/email/devEmailStore";
import { routes } from "@/shared/routes";
import { devEmailsContent as content, EMAIL_PREVIEW_WIDTHS } from "../content/devEmails";

export interface DevEmailViewProps {
  email: StoredEmail;
  width: number;
}

/** One saved email: its envelope, the HTML in a sandboxed frame, and the plain text. */
export function DevEmailView({ email, width }: DevEmailViewProps) {
  const envelope = [
    [content.from, email.fromName],
    [content.toLabel, email.to],
    [content.subject, email.subject],
    [content.preheader, email.preheader],
  ] as const;

  return (
    <main className="mx-auto flex w-full max-w-300 flex-col gap-8 px-4 py-12">
      <Link href={routes.dev.emails} className="self-start">
        {content.back}
      </Link>
      <h1 className="page-title">{email.subject}</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {envelope.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="body-strong">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-4">
        <h2 className="section-title">{content.html}</h2>
        <nav className="flex gap-4">
          <Link href={routes.dev.email(email.id, EMAIL_PREVIEW_WIDTHS.phone)}>{content.widths.phone}</Link>
          <Link href={routes.dev.email(email.id, EMAIL_PREVIEW_WIDTHS.desktop)}>{content.widths.desktop}</Link>
        </nav>
        {/* sandbox with no permissions: the email's HTML can't run scripts or reach this page. */}
        <iframe
          title={content.frameTitle(email.subject)}
          srcDoc={email.html}
          sandbox=""
          style={{ width }}
          className="h-[1400px] max-w-full border border-line"
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="section-title">{content.text}</h2>
        <pre className="overflow-x-auto rounded-md border border-line bg-flour-raised p-4 whitespace-pre-wrap">
          {email.text}
        </pre>
      </section>
    </main>
  );
}
