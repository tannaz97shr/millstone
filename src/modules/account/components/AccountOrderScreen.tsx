"use client";

import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { Card } from "@/shared/components/atoms/Card/Card";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { LoadErrorNotice, LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { routes } from "@/shared/routes";
import { formatCents } from "@/shared/utils/money";
import { formatPhone } from "@/shared/utils/phone";
import { formatPickupDay, formatTimeOfDay } from "@/shared/utils/pickup-dates";
import { accountContent } from "../content/accountContent";
import { useAccountOrder } from "../hooks/useAccountOrders";
import type { AccountOrder } from "../types/accountOrder";
import { BackLink } from "./BackLink";
import { OrderCall } from "./OrderCall";
import { OrderLabels } from "./OrderLabels";

const content = accountContent.order;
const orderWords = accountContent.myAccount.orders;

function paymentNote(order: AccountOrder): string {
  if (order.paymentStatus === "paid") return content.paid.note;
  if (order.paymentStatus === "refunded") return content.refunded.note;
  if (order.status === "cancelled") return content.cancelledUnpaid;
  return content.unpaid.note(formatCents(order.totalCents));
}

/** Undesigned: one of the account's orders, built from C7's pickup card and C9's card. */
function AccountOrderDetails({ order }: { order: AccountOrder }) {
  const open = order.status === "placed" || order.status === "ready";
  return (
    <>
      <div className="flex flex-col gap-3">
        <h1 className="page-title tabular-nums">{content.title(order.orderNumber)}</h1>
        <OrderLabels order={order} />
      </div>

      {order.generationNote && (
        <Notice tone="warning" role="note" title={order.generationNote}>
          <OrderCall
            before={orderWords.noteHelp(order.branch.name)}
            phone={order.branch.phone}
            after={orderWords.noteHelpAfter}
          />
        </Notice>
      )}

      <Card as="section" aria-labelledby="account-order-pickup" className="flex flex-col gap-3">
        <h2 id="account-order-pickup" className="section-title">
          {content.pickupTitle}
        </h2>
        <div className="flex flex-col">
          <span className="body-strong">{formatPickupDay(order.pickupDate)}</span>
          <span>{content.branchName(order.branch.name)}</span>
          <span className="text-ink-muted">{order.branch.address}</span>
          <span className="text-ink-muted">{content.readyFrom(formatTimeOfDay(order.branch.opensAt))}</span>
        </div>
        <hr className="border-line" />
        <ul className="flex flex-col gap-1">
          {order.lines.map((line, index) => (
            <li key={index} className="flex justify-between gap-3 tabular-nums">
              <span>{orderWords.line(line.quantity, line.name)}</span>
              <span>{formatCents(line.lineTotalCents)}</span>
            </li>
          ))}
          {order.lines.length === 0 && <li>{orderWords.noItems}</li>}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="body-strong">{content.total}</span>
          <span className="price">{formatCents(order.totalCents)}</span>
        </div>
        <p className="caption text-ink-muted">{paymentNote(order)}</p>
      </Card>

      {order.notes && (
        <section aria-labelledby="account-order-notes" className="flex flex-col gap-1">
          <h2 id="account-order-notes" className="body-strong">
            {content.notesTitle}
          </h2>
          <p>{order.notes}</p>
        </section>
      )}

      <section aria-labelledby="account-order-contact" className="flex flex-col gap-1">
        <h2 id="account-order-contact" className="body-strong">
          {content.contactTitle}
        </h2>
        <p>{order.contact.name}</p>
        <p>{formatPhone(order.contact.phone)}</p>
        <p>{order.contact.email}</p>
      </section>

      {open && (
        <section
          aria-labelledby="account-order-change"
          className="flex flex-col gap-1 rounded-md border-(length:--control-border) border-line-strong p-4"
        >
          <h2 id="account-order-change" className="body-strong">
            {content.changeTitle}
          </h2>
          <p>
            <OrderCall before={content.call(order.branch.name)} phone={order.branch.phone} after={content.callAfter} />
          </p>
        </section>
      )}
    </>
  );
}

export function AccountOrderScreen({ orderId }: { orderId: string }) {
  const query = useAccountOrder(orderId);
  return (
    <div className="flex flex-col gap-6">
      <BackLink href={routes.account.home}>{content.back}</BackLink>
      {query.data && <AccountOrderDetails order={query.data} />}
      {query.isPending && <LoadingMessage>{content.loading}</LoadingMessage>}
      {query.isError &&
        (toApiFailure(query.error).status === 404 ? (
          <section className="flex flex-col items-start gap-4">
            <p>{content.notFound}</p>
            <ButtonLink href={routes.account.home} variant="secondary">
              {content.backToAccount}
            </ButtonLink>
          </section>
        ) : (
          <LoadErrorNotice retryLabel={content.retry} onRetry={() => void query.refetch()} retrying={query.isFetching}>
            {content.loadError}
          </LoadErrorNotice>
        ))}
    </div>
  );
}
