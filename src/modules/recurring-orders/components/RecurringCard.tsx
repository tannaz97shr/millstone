import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { Card } from "@/shared/components/atoms/Card/Card";
import { RecurringStatusTag } from "@/shared/components/atoms/RecurringStatusTag/RecurringStatusTag";
import type { IsoDate } from "@/shared/domain";
import { routes } from "@/shared/routes";
import { recurringContent } from "../content/recurringContent";
import { daysText, itemLines, nextLine } from "../lib/recurringText";
import type { RecurringOrderSummary } from "../types/recurringOrderView";

const content = recurringContent.list;

/** One recurring order in C10 (RecList.dc.html). */
export function RecurringCard({ summary, today }: { summary: RecurringOrderSummary; today: IsoDate }) {
  return (
    <Card as="article" aria-labelledby={`rec-${summary.id}`} className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 id={`rec-${summary.id}`} className="branch-name">
          {summary.branch.name}
        </h2>
        <RecurringStatusTag status={summary.status} />
      </div>
      <span className="body-strong">{daysText(summary.daysOfWeek)}</span>
      <span>{itemLines(summary.items).join(", ")}</span>
      <span className="caption text-ink-muted">{nextLine(summary, today)}</span>
      <ButtonLink
        href={routes.account.recurring.detail(summary.id)}
        variant="secondary"
        block
        aria-label={content.openLabel(summary.branch.name)}
        className="mt-1"
      >
        {content.open}
      </ButtonLink>
    </Card>
  );
}
