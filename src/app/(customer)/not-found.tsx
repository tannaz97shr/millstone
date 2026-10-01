import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { shellContent } from "@/shared/content/shell";
import { routes } from "@/shared/routes";

const content = shellContent.notFound;

export default function NotFound() {
  return (
    <section className="flex flex-col items-start gap-4">
      <h1 className="page-title">{content.title}</h1>
      <p>{content.body}</p>
      <ButtonLink href={routes.home} variant="primary">
        {content.home}
      </ButtonLink>
    </section>
  );
}
