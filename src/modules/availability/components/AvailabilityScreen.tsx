"use client";

import { useCallback, useEffect } from "react";
import { LoadErrorNotice, LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { StatusLine } from "@/shared/components/molecules/StatusLine/StatusLine";
import type { BranchId, IsoDate } from "@/shared/domain";
import { availabilityContent } from "../content/availabilityContent";
import { type AvailabilityFocusRequest, useAvailabilityActions } from "../hooks/useAvailabilityActions";
import { useAvailabilityView } from "../hooks/useAvailabilityView";
import { useBranchAvailabilityQuery } from "../hooks/useBranchAvailabilityQuery";
import { allProducts, availabilityCounts } from "../lib/availabilityRules";
import { soldOutDateFor } from "../lib/availabilityView";
import { AvailabilityGroups } from "./AvailabilityGroups";
import { AvailabilityHeader } from "./AvailabilityHeader";

const content = availabilityContent;

const AVAILABILITY_STATUS_ID = "availability-status";

export interface AvailabilityScreenProps {
  owner: boolean;
  /** Staff: their branch. Owner: the first branch, until they choose another. */
  defaultBranchId: BranchId;
}

function focusTarget(request: AvailabilityFocusRequest): HTMLElement | null {
  if (request.kind === "status") return document.getElementById(AVAILABILITY_STATUS_ID);
  return document.querySelector<HTMLElement>(
    `[data-availability-row="${CSS.escape(request.productId)}"] [data-row-action="${request.action}"]`,
  );
}

/**
 * A4 branch availability (AC-P4, P5): every active product at one branch,
 * switched on or off, and sold out for the chosen day. Staff see their own
 * branch; the owner chooses any.
 */
export function AvailabilityScreen({ owner, defaultBranchId }: AvailabilityScreenProps) {
  const { view, setView } = useAvailabilityView(owner);
  const branchId = (owner && view.branch) || defaultBranchId;
  const query = useBranchAvailabilityQuery(branchId);
  const data = query.data;
  const switching = query.isPlaceholderData;

  const branchName = data?.branches.find((branch) => branch.id === branchId)?.name ?? data?.branch.name ?? "";
  const actions = useAvailabilityActions({ branchId, branchName });

  const { focusRequest, focusHandled } = actions;
  useEffect(() => {
    if (!focusRequest) return;
    (focusTarget(focusRequest) ?? document.getElementById(AVAILABILITY_STATUS_ID))?.focus();
    focusHandled();
  }, [focusRequest, focusHandled, data]);

  const { clearMessage } = actions;
  const changeBranch = useCallback(
    (next: BranchId) => {
      clearMessage();
      setView({ branch: next });
    },
    [clearMessage, setView],
  );
  const changeDate = useCallback(
    (next: IsoDate) => {
      clearMessage();
      setView({ date: next });
    },
    [clearMessage, setView],
  );

  if (!data) {
    return (
      <div className="flex flex-col gap-4 px-8 py-8">
        <h1 className="admin-title">{content.pageTitle}</h1>
        {query.isError ? (
          <LoadErrorNotice
            retryLabel={content.load.retry}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          >
            {content.load.failed}
          </LoadErrorNotice>
        ) : (
          <LoadingMessage>{content.load.loading}</LoadingMessage>
        )}
      </div>
    );
  }

  const date = soldOutDateFor(view.date, data.calendar);
  const summary = switching
    ? query.isError
      ? content.load.failedBranch(branchName)
      : content.loadingBranch(branchName)
    : content.summary(availabilityCounts(allProducts(data.categories)));

  return (
    <div className="flex flex-col">
      <AvailabilityHeader
        branchName={branchName}
        branches={owner ? data.branches : null}
        branchId={branchId}
        onBranchChange={changeBranch}
        calendar={data.calendar}
        date={date}
        onDateChange={changeDate}
      />
      <StatusLine
        id={AVAILABILITY_STATUS_ID}
        message={switching ? null : actions.message}
        onDismissMessage={clearMessage}
        summary={summary}
      />
      <div className="flex flex-col gap-7 px-8 pt-1 pb-10" inert={switching}>
        {query.isError && (
          <LoadErrorNotice
            retryLabel={content.load.retry}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          >
            {content.load.failed}
          </LoadErrorNotice>
        )}
        <AvailabilityGroups
          categories={data.categories}
          branchName={branchName}
          date={date}
          hiddenCount={data.hiddenCount}
          onChange={(product, change) => void actions.run(product, change)}
        />
      </div>
    </div>
  );
}
