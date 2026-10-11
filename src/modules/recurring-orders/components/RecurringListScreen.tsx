"use client";

import { BackLink } from "@/modules/account/components/BackLink";
import { useBranchesQuery } from "@/modules/branches/hooks/useBranchesQuery";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { Card } from "@/shared/components/atoms/Card/Card";
import { LoadErrorNotice, LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { routes } from "@/shared/routes";
import { recurringContent } from "../content/recurringContent";
import { useRecurringOrders } from "../hooks/useRecurringOrders";
import { sharedCutoff } from "../lib/recurringText";
import { RecurringCard } from "./RecurringCard";

const content = recurringContent.list;

/** C10 My recurring orders (RecList.dc.html, RecListEnded.dc.html): live ones first, ended ones last. */
export function RecurringListScreen() {
  const query = useRecurringOrders();
  const branches = useBranchesQuery().data?.branches ?? [];
  const recurringOrders = query.data?.recurringOrders ?? [];
  const cutoff = branches.length ? sharedCutoff(branches) : null;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={routes.account.home}>{content.back}</BackLink>
      <div className="flex flex-col gap-2">
        <h1 className="page-title">{content.title}</h1>
        <p>{content.intro(cutoff)}</p>
      </div>
      {query.isError && !query.data ? (
        <LoadErrorNotice
          retryLabel={recurringContent.common.retry}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        >
          {recurringContent.common.loadError}
        </LoadErrorNotice>
      ) : !query.data ? (
        <LoadingMessage>{recurringContent.common.loading}</LoadingMessage>
      ) : recurringOrders.length === 0 ? (
        <Card className="flex flex-col gap-2 px-4 py-5">
          <p className="body-strong">{content.emptyTitle}</p>
          <p className="text-ink-muted">{content.emptyBody}</p>
        </Card>
      ) : (
        recurringOrders.map((summary) => <RecurringCard key={summary.id} summary={summary} today={query.data.today} />)
      )}
      <ButtonLink href={routes.account.recurring.new} variant="primary" icon="plus" block>
        {content.setUp}
      </ButtonLink>
    </div>
  );
}
