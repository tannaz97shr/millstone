import { shellContent } from "@/shared/content/shell";

const content = shellContent.placeholders.adminHome;

export default function AdminHomePage() {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="admin-title">{content.title}</h1>
      <p className="text-ink-muted">{content.body}</p>
    </section>
  );
}
