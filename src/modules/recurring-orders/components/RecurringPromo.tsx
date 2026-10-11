import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { Card } from "@/shared/components/atoms/Card/Card";
import { RecurringLabel } from "@/shared/components/atoms/RecurringLabel/RecurringLabel";
import { routes } from "@/shared/routes";
import { recurringContent } from "../content/recurringContent";

const content = recurringContent.promo;

/**
 * C1's "For cafes and regulars" (Home.dc.html). A guest is sent to C8 first
 * (the /account gate), which says why an account is needed (AC-R1).
 */
export function RecurringPromo({ cutoff }: { cutoff: string | null }) {
  return (
    <Card as="section" aria-labelledby="recurring-promo-title" className="flex flex-col gap-3 shadow-none">
      <div className="flex">
        <RecurringLabel />
      </div>
      <h2 id="recurring-promo-title" className="section-title">
        {content.title}
      </h2>
      <p>{content.body(cutoff)}</p>
      <p className="caption text-ink-muted">{content.account}</p>
      <ButtonLink href={routes.account.recurring.new} variant="secondary" block>
        {content.action}
      </ButtonLink>
    </Card>
  );
}
