import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { Card } from "@/shared/components/atoms/Card/Card";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { routes } from "@/shared/routes";
import { formatCents } from "@/shared/utils/money";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { accountContent } from "../content/accountContent";
import type { AccountOrder } from "../types/accountOrder";
import { OrderCall } from "./OrderCall";
import { OrderLabels } from "./OrderLabels";

const content = accountContent.myAccount.orders;

/** One order in C9's "Your orders" (AccountArea.dc.html), plus a link to its page. */
export function AccountOrderCard({ order }: { order: AccountOrder }) {
  const open = order.status === "placed" || order.status === "ready";
  const items = order.lines.map((line) => content.line(line.quantity, line.name)).join(", ") || content.noItems;
  return (
    <Card as="article" aria-label={order.orderNumber} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="body-strong tabular-nums">{order.orderNumber}</span>
        <span className="price">{formatCents(order.totalCents)}</span>
      </div>
      <span>{content.pickup(formatPickupDay(order.pickupDate), order.branch.name)}</span>
      <OrderLabels order={order} />
      <p className="text-ink-muted">{items}</p>
      {order.generationNote && (
        <Notice tone="warning" role="note" title={order.generationNote}>
          <OrderCall before={content.noteHelp(order.branch.name)} phone={order.branch.phone} after={content.noteHelpAfter} />
        </Notice>
      )}
      {open && (
        <p className="caption text-ink-muted">
          <OrderCall before={content.call(order.branch.name)} phone={order.branch.phone} after={content.callAfter} />
        </p>
      )}
      <ButtonLink
        href={routes.account.order(order.orderId)}
        variant="quiet"
        aria-label={content.detailsLabel(order.orderNumber)}
        className="-ml-2 self-start"
      >
        {content.details}
      </ButtonLink>
    </Card>
  );
}
