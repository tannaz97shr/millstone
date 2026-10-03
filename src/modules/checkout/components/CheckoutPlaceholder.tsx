import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { routes } from "@/shared/routes";
import { checkoutContent } from "../content/checkoutContent";

const content = checkoutContent.placeholder;

/** Stands in for C5 until the checkout step. */
export function CheckoutPlaceholder() {
  return (
    <section className="flex flex-col items-start gap-4">
      <h1 className="page-title">{content.title}</h1>
      <p className="text-ink-muted">{content.body}</p>
      <ButtonLink href={routes.cart} icon="left">
        {content.back}
      </ButtonLink>
    </section>
  );
}
