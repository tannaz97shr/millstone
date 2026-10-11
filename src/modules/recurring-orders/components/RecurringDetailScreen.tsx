"use client";

import { useCallback, useEffect, useState } from "react";
import { BackLink } from "@/modules/account/components/BackLink";
import { Button } from "@/shared/components/atoms/Button/Button";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { RecurringLabel } from "@/shared/components/atoms/RecurringLabel/RecurringLabel";
import { RecurringStatusTag } from "@/shared/components/atoms/RecurringStatusTag/RecurringStatusTag";
import { LoadErrorNotice, LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { routes } from "@/shared/routes";
import { recurringContent } from "../content/recurringContent";
import { useRecurringActions } from "../hooks/useRecurringActions";
import { useRecurringOrder } from "../hooks/useRecurringOrders";
import { clearRecurringFlash, peekRecurringFlash } from "../lib/recurringFlash";
import { daysText, endedTitle } from "../lib/recurringText";
import type { RecurringOrderDetail } from "../types/recurringOrderView";
import { EachOrderSection } from "./EachOrderSection";
import { EndRecurringSheet } from "./EndRecurringSheet";
import { RecurringFlashNotice } from "./RecurringFlashNotice";
import { RecurringNotFound } from "./RecurringNotFound";
import { RecurringProblemNotice } from "./RecurringProblemNotice";
import { UpcomingPickups } from "./UpcomingPickups";

const content = recurringContent.detail;

/** C12 (RecDetail, RecDetailPaused, RecDetailEnd, RecDetailEnded). */
export function RecurringDetailScreen({ recurringOrderId }: { recurringOrderId: string }) {
  const query = useRecurringOrder(recurringOrderId);

  if (query.data) return <RecurringDetail detail={query.data} />;
  if (query.isError && toApiFailure(query.error).status === 404) return <RecurringNotFound />;
  return (
    <div className="flex flex-col gap-6">
      <BackLink href={routes.account.recurring.list}>{content.back}</BackLink>
      {query.isError ? (
        <LoadErrorNotice
          retryLabel={recurringContent.common.retry}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        >
          {recurringContent.common.loadErrorOne}
        </LoadErrorNotice>
      ) : (
        <LoadingMessage>{recurringContent.common.loadingOne}</LoadingMessage>
      )}
    </div>
  );
}

function RecurringDetail({ detail }: { detail: RecurringOrderDetail }) {
  // "Your recurring order is set up…" or "Changes saved…" from C11, once.
  const [arrivedWith] = useState(() => peekRecurringFlash(detail.id));
  useEffect(() => clearRecurringFlash(detail.id), [detail.id]);

  const actions = useRecurringActions(detail, arrivedWith);
  const [endOpen, setEndOpen] = useState(false);
  const { focusDone } = actions;
  const onFocused = useCallback(() => focusDone(), [focusDone]);

  const paused = detail.status === "paused";
  const ended = detail.status === "ended";

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={routes.account.recurring.list}>{content.back}</BackLink>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <RecurringLabel />
          <RecurringStatusTag status={detail.status} />
        </div>
        <h1 className="page-title">{content.title(detail.branch.name, daysText(detail.daysOfWeek))}</h1>
      </div>

      <RecurringFlashNotice flash={actions.flash} onDismiss={actions.dismissFlash} />
      <RecurringProblemNotice problem={actions.problem} />

      {paused && (
        <div className="flex flex-col gap-3 rounded-lg border-[1.5px] border-dashed border-line-strong bg-flour-raised p-4">
          <p className="body-strong">{content.pausedTitle}</p>
          <p>{content.pausedBody}</p>
          <Button
            variant="primary"
            block
            onClick={() => actions.pending === null && void actions.resume()}
            aria-disabled={actions.pending !== null || undefined}
          >
            {actions.pending === "resume" ? content.resuming : content.resume}
          </Button>
        </div>
      )}

      {ended && (
        <div className="flex flex-col gap-2 rounded-lg bg-flour-sunk p-4">
          <p className="body-strong">{endedTitle(detail)}</p>
          <p>{content.endedBody(detail.branch.name)}</p>
        </div>
      )}

      <UpcomingPickups
        detail={detail}
        onSkip={(date) => void actions.skip(date)}
        onUndo={(date) => void actions.unskip(date)}
        pendingDate={actions.pendingDate}
        focusTarget={actions.focusTarget}
        onFocused={onFocused}
      />

      <EachOrderSection detail={detail} />

      {!ended && (
        <div className="flex flex-col gap-2">
          <ButtonLink href={routes.account.recurring.edit(detail.id)} variant="secondary" block>
            {content.edit}
          </ButtonLink>
          {!paused && (
            <Button
              variant="secondary"
              block
              onClick={() => actions.pending === null && void actions.pause()}
              aria-disabled={actions.pending !== null || undefined}
            >
              {actions.pending === "pause" ? content.pausing : content.pause}
            </Button>
          )}
          <Button variant="danger" block onClick={() => setEndOpen(true)}>
            {content.end}
          </Button>
        </div>
      )}

      {!ended && (
        <EndRecurringSheet
          // A fresh sheet each time it opens: "Stop now" chosen, the first day ready.
          key={endOpen ? "open" : "closed"}
          open={endOpen}
          detail={detail}
          onClose={() => setEndOpen(false)}
          pending={actions.pending === "end_now" || actions.pending === "end_after"}
          // Closed after either answer: a refusal is said on the page behind, which the sheet keeps inert.
          onEndNow={async () => {
            await actions.endNow();
            setEndOpen(false);
          }}
          onEndAfter={async (date) => {
            await actions.endAfter(date);
            setEndOpen(false);
          }}
        />
      )}
    </div>
  );
}
