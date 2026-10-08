"use client";

import { Button } from "@/shared/components/atoms/Button/Button";
import { Icon } from "@/shared/components/atoms/Icon/Icon";
import { PaymentLabel } from "@/shared/components/atoms/PaymentLabel/PaymentLabel";
import { RecurringLabel } from "@/shared/components/atoms/RecurringLabel/RecurringLabel";
import { SectionLabel } from "@/shared/components/atoms/SectionLabel/SectionLabel";
import { StatusBadge } from "@/shared/components/atoms/StatusBadge/StatusBadge";
import { LoadErrorNotice, LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { SidePanel } from "@/shared/components/organisms/SidePanel/SidePanel";
import type { IsoInstant, OrderId } from "@/shared/domain";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { formatCents } from "@/shared/utils/money";
import { formatPhone } from "@/shared/utils/phone";
import { formatMelbourneStamp, formatPickupDay } from "@/shared/utils/pickup-dates";
import { adminOrdersContent } from "../content/adminOrdersContent";
import { useAdminOrderQuery } from "../hooks/useAdminOrderQuery";
import type { StatusMessage } from "../hooks/useOrderActions";
import { isFinal, isRefundDue, orderHistory, paymentLine } from "../lib/orderDetailView";
import type { AdminOrderDetail } from "../types/adminOrder";

const content = adminOrdersContent.panel;

export const ORDER_PANEL_ID = "order-panel";
export const PANEL_MESSAGE_ID = "order-panel-message";

export interface OrderPanelProps {
  orderId: OrderId | null;
  /** The list's copy of the order, for the heading while the detail loads. */
  orderNumber: string | null;
  onClose: () => void;
  pending: boolean;
  /** The last action's message, repeated here because the list is behind the panel. */
  message: StatusMessage | null;
  onDismissMessage: () => void;
  onReady: (order: AdminOrderDetail) => void;
  onCollected: (order: AdminOrderDetail) => void;
  onCancel: (order: AdminOrderDetail) => void;
  onMarkRefunded: (order: AdminOrderDetail) => void;
}

function payLine(order: AdminOrderDetail): string {
  const line = paymentLine(order);
  const when = (at: IsoInstant | null) => (at ? formatMelbourneStamp(at) : "");
  switch (line.kind) {
    case "refunded":
      return content.refundedLine(when(line.at), line.ref);
    case "paid":
      return content.paidLine(when(line.at), line.ref);
    case "nothing_paid":
      return content.nothingPaid;
    case "unpaid":
      return content.unpaidLine(formatCents(order.totalCents));
  }
}

/** The provider's page for this payment, in a new tab: staff refund there. */
function StripeLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-12 items-center self-start font-bold text-crust underline underline-offset-3 hover:text-crust-deep"
    >
      {content.seeInStripe}
      <span className="sr-only">{content.newTab}</span>
    </a>
  );
}

function cancellationText(order: AdminOrderDetail): string | null {
  if (!order.cancellationReason) return null;
  if (order.cancellationReason === "other") return order.cancellationNote;
  return adminOrdersContent.reasons[order.cancellationReason].label;
}

function PanelBody({ order }: { order: AdminOrderDetail }) {
  const total = formatCents(order.totalCents);
  const reason = cancellationText(order);
  return (
    <>
      {order.generationNote && (
        <div className="flex items-start gap-3 rounded-md border-2 border-wheat bg-wheat-soft px-5 py-4 text-wheat-ink">
          <Icon name="alert" sizeClassName="size-6" className="mt-0.5 shrink-0" />
          <div className="flex flex-col gap-1">
            <strong className="text-[20px]/[28px]">{order.generationNote}</strong>
            <span className="text-[18px]/[26px]">{content.generationHint}</span>
          </div>
        </div>
      )}

      <section aria-labelledby="panel-customer" className="flex flex-col gap-1">
        <SectionLabel id="panel-customer" className="mb-1">
          {content.customer}
        </SectionLabel>
        <p className="text-[22px]/[30px] font-bold">{order.contactName}</p>
        <a
          href={`tel:${order.contactPhone}`}
          className="inline-flex min-h-12 items-center self-start font-bold text-crust tabular-nums underline underline-offset-3 hover:text-crust-deep"
        >
          {formatPhone(order.contactPhone)}
        </a>
        <a href={`mailto:${order.contactEmail}`} className="inline-flex min-h-12 items-center self-start break-all text-crust underline underline-offset-3 hover:text-crust-deep">
          {order.contactEmail}
        </a>
      </section>

      {order.notes && (
        <section aria-labelledby="panel-notes" className="flex flex-col gap-2">
          <SectionLabel id="panel-notes">{content.notes}</SectionLabel>
          <p className="rounded-md bg-flour px-4 py-3">{order.notes}</p>
        </section>
      )}

      <section aria-labelledby="panel-items" className="flex flex-col gap-2">
        <SectionLabel id="panel-items">{content.items}</SectionLabel>
        <table className="w-full border-collapse tabular-nums">
          <thead>
            <tr className="text-left text-[16px]/[22px] text-ink-muted">
              <th scope="col" className="py-1 font-normal">{content.itemColumn}</th>
              <th scope="col" className="py-1 text-right font-normal">{content.eachColumn}</th>
              <th scope="col" className="py-1 text-right font-normal">{content.totalColumn}</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={line.productName} className="border-t border-line">
                <td className="py-2.5 pr-3">
                  <strong>{content.quantity(line.quantity)}</strong> {line.productName}
                </td>
                <td className="py-2.5 text-right text-ink-muted">{formatCents(line.unitPriceCents)}</td>
                <td className="py-2.5 text-right">{formatCents(line.lineTotalCents)}</td>
              </tr>
            ))}
            {order.lines.length === 0 && (
              <tr className="border-t border-line">
                <td colSpan={3} className="py-2.5 text-ink-muted">{content.noItems}</td>
              </tr>
            )}
            <tr className="border-t-2 border-ink">
              <th scope="row" colSpan={2} className="py-3 text-left text-[22px]">{content.total}</th>
              <td className="py-3 text-right text-[22px] font-bold">{total}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section aria-labelledby="panel-payment" className="flex flex-col gap-1">
        <SectionLabel id="panel-payment" className="mb-1">
          {content.payment}
        </SectionLabel>
        <p className="font-bold">{order.paymentMethod === "online" ? content.methodOnline : content.methodAtPickup}</p>
        <p className="text-[18px]/[26px] text-ink-muted">{payLine(order)}</p>
        {/* While a refund is due, the refund box above carries the link instead. */}
        {order.paymentDashboardUrl && !isRefundDue(order) && <StripeLink href={order.paymentDashboardUrl} />}
      </section>

      {reason && (
        <section aria-labelledby="panel-reason" className="flex flex-col gap-1">
          <SectionLabel id="panel-reason" className="mb-1">
            {content.reason}
          </SectionLabel>
          <p>{reason}</p>
        </section>
      )}

      <section aria-labelledby="panel-history" className="flex flex-col gap-2">
        <SectionLabel id="panel-history">{content.history}</SectionLabel>
        <ol className="flex flex-col">
          {orderHistory(order).map((entry) => (
            <li
              key={entry.event}
              className="flex justify-between gap-4 border-t border-line py-2.5 text-[18px]/[26px]"
            >
              <strong>{content.historyLabels[entry.event]}</strong>
              <span className="text-ink-muted tabular-nums">{formatMelbourneStamp(entry.at)}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

/**
 * A3: one order in full (AC-A5) beside the list, with its actions (AC-A6 to
 * A10). Collected and cancelled orders are read-only, apart from Mark refunded
 * on a cancelled order that was paid online.
 */
export function OrderPanel({
  orderId,
  orderNumber,
  onClose,
  pending,
  message,
  onDismissMessage,
  onReady,
  onCollected,
  onCancel,
  onMarkRefunded,
}: OrderPanelProps) {
  const query = useAdminOrderQuery(orderId);
  const order = query.data;
  const notFound = query.isError && toApiFailure(query.error).status === 404;

  const refundDue = order ? isRefundDue(order) : false;
  const final = order ? isFinal(order) : false;

  // A cancelled order still owing a refund has its one action in the body.
  const footer = order && !(final && refundDue) && (
    <div className="flex flex-col gap-3">
      {!final && (
        <>
          <div className="flex gap-3">
            {order.status === "placed" && (
              <Button
                variant="primary"
                counter
                icon="check"
                className="grow"
                aria-disabled={pending || undefined}
                onClick={() => !pending && onReady(order)}
              >
                {content.ready}
              </Button>
            )}
            <Button
              variant={order.status === "ready" ? "ready" : "secondary"}
              counter
              icon="check"
              className="grow"
              data-action="collected"
              aria-disabled={pending || undefined}
              onClick={() => !pending && onCollected(order)}
            >
              {content.collected}
            </Button>
          </div>
          <Button variant="danger" icon="cross" className="self-start" onClick={() => onCancel(order)}>
            {content.cancelOrder}
          </Button>
        </>
      )}
      {final && !refundDue && (
        <p className="text-[18px]/[26px] text-ink-muted">
          {order.status === "collected" ? content.lockedCollected : content.lockedCancelled}
        </p>
      )}
    </div>
  );

  return (
    <SidePanel
      open={orderId !== null}
      onClose={onClose}
      closeLabel={content.close}
      id={ORDER_PANEL_ID}
      titleClassName="text-[36px]/[40px] font-bold tracking-[0.02em] tabular-nums"
      title={order?.orderNumber ?? orderNumber ?? ""}
      header={
        order && (
          <>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={order.status} />
              {order.paymentLabel && <PaymentLabel status={order.paymentLabel} />}
              {order.recurring && <RecurringLabel />}
            </div>
            <p className="font-bold">{content.pickup(formatPickupDay(order.pickupDate), order.branchName)}</p>
          </>
        )
      }
      footer={footer}
    >
      <>
        {message && (
          <Notice
            tone={message.tone}
            role={message.tone === "error" ? "alert" : "status"}
            onDismiss={message.tone === "error" ? onDismissMessage : undefined}
          >
            <span id={PANEL_MESSAGE_ID} tabIndex={-1} className="font-bold focus-visible:shadow-none">
              {message.text}
            </span>
          </Notice>
        )}
        {refundDue && order && (
          <div role="note" className="flex flex-col gap-4 rounded-md border-2 border-brick bg-brick-soft p-5">
            <div className="flex items-start gap-3">
              <Icon name="alert" sizeClassName="size-6" className="mt-0.5 shrink-0 text-brick" />
              <div className="flex flex-col gap-1">
                <strong className="text-[20px]/[28px] text-brick">
                  {content.refundTitle(formatCents(order.totalCents))}
                </strong>
                <span className="text-[18px]/[26px]">{content.refundBody}</span>
              </div>
            </div>
            {order.paymentDashboardUrl && <StripeLink href={order.paymentDashboardUrl} />}
            <Button
              variant="primary"
              icon="refund"
              block
              aria-disabled={pending || undefined}
              onClick={() => !pending && onMarkRefunded(order)}
            >
              {content.markRefunded}
            </Button>
          </div>
        )}
        {order ? (
          <PanelBody order={order} />
        ) : notFound ? (
          <Notice tone="neutral">{content.notFound}</Notice>
        ) : query.isError ? (
          <LoadErrorNotice
            retryLabel={adminOrdersContent.load.retry}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          >
            {content.failed}
          </LoadErrorNotice>
        ) : (
          <LoadingMessage>{content.loading}</LoadingMessage>
        )}
      </>
    </SidePanel>
  );
}
