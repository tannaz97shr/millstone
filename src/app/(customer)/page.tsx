import { shellContent } from "@/shared/content/shell";

const content = shellContent.placeholders.customerHome;

export default function HomePage() {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="page-title">{content.title}</h1>
      <p className="text-ink-muted">{content.body}</p>
    </section>
  );
}
