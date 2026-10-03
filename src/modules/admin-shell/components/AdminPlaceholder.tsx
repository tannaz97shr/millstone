export interface AdminPlaceholderProps {
  title: string;
  body: string;
}

/** A page a later step builds. */
export function AdminPlaceholder({ title, body }: AdminPlaceholderProps) {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="admin-title">{title}</h1>
      <p className="text-ink-muted">{body}</p>
    </section>
  );
}
