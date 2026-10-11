"use client";

import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { Card } from "@/shared/components/atoms/Card/Card";
import { RecurringLabel } from "@/shared/components/atoms/RecurringLabel/RecurringLabel";
import { LoadErrorNotice, LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { routes } from "@/shared/routes";
import { recurringContent } from "../content/recurringContent";
import { useRecurringOrders } from "../hooks/useRecurringOrders";
import { accountSummary } from "../lib/recurringText";

const content = recurringContent.account;

/**
 * C9's Recurring orders section (AccountArea.dc.html): how many, the next
 * pickup, and the way in. With none at all, the button goes straight to C11.
 */
export function RecurringSummarySection() {
  const query = useRecurringOrders();
  const data = query.data;
  const live = data?.recurringOrders.some((summary) => summary.status !== "ended") ?? false;
  const any = (data?.recurringOrders.length ?? 0) > 0;

  return (
    <Card as="section" aria-labelledby="account-recurring-title" className="flex flex-col gap-3">
      <div className="flex">
        <RecurringLabel />
      </div>
      <h2 id="account-recurring-title" className="section-title">
        {content.title}
      </h2>
      {data ? (
        <>
          <p>{accountSummary(data)}</p>
          <ButtonLink
            href={any ? routes.account.recurring.list : routes.account.recurring.new}
            variant="secondary"
            block
          >
            {live ? content.manage : content.setUp}
          </ButtonLink>
        </>
      ) : query.isError ? (
        <LoadErrorNotice
          retryLabel={recurringContent.common.retry}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        >
          {recurringContent.common.loadError}
        </LoadErrorNotice>
      ) : (
        <LoadingMessage>{recurringContent.common.loading}</LoadingMessage>
      )}
    </Card>
  );
}
