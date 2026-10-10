"use client";

import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { LoadErrorNotice, LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { routes } from "@/shared/routes";
import { accountContent } from "../content/accountContent";
import { useAccountOrders } from "../hooks/useAccountOrders";
import { AccountOrderCard } from "./AccountOrderCard";

const content = accountContent.myAccount.orders;

/** C9 "Your orders": the account's own orders, newest pickup day first, or MyAccountNew's empty box. */
export function AccountOrders() {
  const query = useAccountOrders();
  return (
    <section aria-labelledby="account-orders-title" className="flex flex-col gap-4">
      <h2 id="account-orders-title" className="section-title">
        {content.title}
      </h2>
      {query.isPending && <LoadingMessage>{content.loading}</LoadingMessage>}
      {query.isError && (
        <LoadErrorNotice retryLabel={content.retry} onRetry={() => void query.refetch()} retrying={query.isFetching}>
          {content.loadError}
        </LoadErrorNotice>
      )}
      {query.data && query.data.orders.length === 0 && (
        <div className="flex flex-col items-start gap-2 rounded-lg border-2 border-dashed border-line-strong bg-flour-raised p-6">
          <p className="body-strong">{content.emptyTitle}</p>
          <p>{content.emptyBody}</p>
          <p className="caption text-ink-muted">{content.guestNote}</p>
          <ButtonLink href={routes.home} variant="primary" className="mt-2">
            {content.startOrder}
          </ButtonLink>
        </div>
      )}
      {query.data && query.data.orders.length > 0 && (
        <>
          <ul className="flex flex-col gap-3">
            {query.data.orders.map((order) => (
              <li key={order.orderId}>
                <AccountOrderCard order={order} />
              </li>
            ))}
          </ul>
          {query.data.limited && <p className="caption text-ink-muted">{content.limited}</p>}
        </>
      )}
    </section>
  );
}
