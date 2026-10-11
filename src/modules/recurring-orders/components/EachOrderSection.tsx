import { PaymentLabel } from "@/shared/components/atoms/PaymentLabel/PaymentLabel";
import { Card } from "@/shared/components/atoms/Card/Card";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { recurringContent } from "../content/recurringContent";
import { daysText, endsLabel } from "../lib/recurringText";
import type { RecurringOrderDetail } from "../types/recurringOrderView";

const content = recurringContent.detail;

/** C12 "Each order": the lines, where and when, and how it's paid. */
export function EachOrderSection({ detail }: { detail: RecurringOrderDetail }) {
  const rows: [string, string][] = [
    [content.pickupFrom, content.pickupFromValue(detail.branch.name, detail.branch.address)],
    [content.days, daysText(detail.daysOfWeek)],
    [content.started, formatPickupDay(detail.startsOn)],
    [content.ends, endsLabel(detail.endsOn)],
  ];
  if (detail.notes) rows.push([content.notes, detail.notes]);

  return (
    <Card as="section" aria-labelledby="each-title" className="flex flex-col gap-3">
      <h2 id="each-title" className="section-title">
        {content.eachTitle}
      </h2>
      <ul className="flex flex-col gap-1">
        {detail.items.map((item) => (
          <li key={item.productId} className="flex flex-col">
            <span className="body-strong tabular-nums">{recurringContent.common.line(item.quantity, item.name)}</span>
            {!item.onMenu && (
              <span className="caption text-ink-muted">{recurringContent.common.offMenu(detail.branch.name)}</span>
            )}
          </li>
        ))}
      </ul>
      <hr className="border-line" />
      <dl className="flex flex-col gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col">
            <dt className="caption text-ink-muted">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center gap-2">
        <PaymentLabel status="unpaid">{content.payAtPickup}</PaymentLabel>
        <span className="caption text-ink-muted">{content.pricesNote}</span>
      </div>
    </Card>
  );
}
