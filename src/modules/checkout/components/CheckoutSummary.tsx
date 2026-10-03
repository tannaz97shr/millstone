import type { BranchSummary } from "@/modules/branches/types/branchSummary";
import { cartContent } from "@/modules/cart/content/cartContent";
import type { CartLineView } from "@/modules/cart/lib/cartLogic";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { Card } from "@/shared/components/atoms/Card/Card";
import type { IsoDate } from "@/shared/domain";
import { routes } from "@/shared/routes";
import { formatCents } from "@/shared/utils/money";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { checkoutContent } from "../content/checkoutContent";

const content = checkoutContent.summary;

export interface CheckoutSummaryProps {
  branch: BranchSummary;
  date: IsoDate;
  lines: readonly CartLineView[];
  count: number;
  /** Shown instead of the lines while their prices load, or when that failed. */
  status?: React.ReactNode;
}

/** "Pickup Tue 6 Oct at Northcote", the item count, Edit (back to C4) and the lines. */
export function CheckoutSummary({ branch, date, lines, count, status }: CheckoutSummaryProps) {
  const titleId = "checkout-summary-title";
  return (
    <Card as="section" aria-labelledby={titleId} className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h2 id={titleId} className="body-strong">
            {content.title(formatPickupDay(date), branch.name)}
          </h2>
          <span className="caption text-ink-muted">{cartContent.itemCount(count)}</span>
        </div>
        {/* -mt-2 -mr-2: the quiet button's text lines up with the card's padding, as in the design. */}
        <ButtonLink href={routes.cart} variant="quiet" aria-label={content.editLabel} className="-mt-2 -mr-2">
          {content.edit}
        </ButtonLink>
      </div>
      {status ?? (
        <ul className="flex flex-col gap-1">
          {lines.map((line) => (
            <li key={line.product.id} className="flex justify-between gap-3 tabular-nums">
              <span>{content.line(line.quantity, line.product.name)}</span>
              <span>{formatCents(line.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
