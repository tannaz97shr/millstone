"use client";

import { useCallback, useEffect, useState } from "react";
import { LoadErrorNotice, LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { componentsContent } from "@/shared/content/components";
import type { OrderId } from "@/shared/domain";
import { formatMelbourneTime, formatPickupDay } from "@/shared/utils/pickup-dates";
import { adminOrdersContent } from "../content/adminOrdersContent";
import { useAdminOrderQuery } from "../hooks/useAdminOrderQuery";
import { useAdminOrdersQuery } from "../hooks/useAdminOrdersQuery";
import { useArrivals } from "../hooks/useArrivals";
import { type FocusRequest, useOrderActions } from "../hooks/useOrderActions";
import { useOrderFilters } from "../hooks/useOrderFilters";
import { useStableRows } from "../hooks/useStableRows";
import { groupOrders } from "../lib/groupOrders";
import { withHeldRows } from "../lib/heldRows";
import { listState, staleSummary } from "../lib/listState";
import { type AdminOrderFilters, filtersToQuery, isSearching, rowFitsFilters } from "../lib/orderFilters";
import type { AdminOrderList, AdminOrderRow } from "../types/adminOrder";
import { CancelOrderDialog } from "./CancelOrderDialog";
import { ConfirmPaymentDialog } from "./ConfirmPaymentDialog";
import { ALL_DATES_BUTTON_ID, focusFilter, OrderFilters, SEARCH_FIELD_ID } from "./OrderFilters";
import { OrderGroups } from "./OrderGroups";
import { ORDER_PANEL_ID, OrderPanel, PANEL_MESSAGE_ID } from "./OrderPanel";
import { OrdersEmpty } from "./OrdersEmpty";
import { OrdersStatusBar, STATUS_LINE_ID } from "./OrdersStatusBar";

const content = adminOrdersContent;

/** How long a focus request waits for its row to render before settling for the status line. */
const ROW_FOCUS_WAIT_MS = 1_000;

const ORDERS_LIST_ID = "orders";

export interface AdminOrdersScreenProps {
  owner: boolean;
}

/** " for today", " for Tue 6 Oct", " in the last 2 weeks" or "". */
function whereText(filters: AdminOrderFilters, data: AdminOrderList | undefined): string {
  if (filters.date === "today") return content.status.whereToday;
  if (filters.date === "tomorrow") return content.status.whereTomorrow;
  if (filters.date !== "all") return content.status.whereDate(formatPickupDay(filters.date));
  return data?.finalSince ? content.status.whereRecent : "";
}

/** The element a focus request points at, if it's on screen. */
function focusTarget(request: FocusRequest, rows: readonly AdminOrderRow[]): HTMLElement | null {
  const panel = document.getElementById(ORDER_PANEL_ID);
  const panelOpen = panel instanceof HTMLDialogElement && panel.open;
  switch (request.kind) {
    case "row-collected": {
      const row = rows.find((r) => r.id === request.orderId);
      if (!row) return null;
      const label = componentsContent.orderRow.collectedLabel(row.orderNumber);
      return document.querySelector<HTMLElement>(`[data-order-row="${CSS.escape(row.id)}"] button[aria-label="${label}"]`);
    }
    case "panel-collected":
      return panel?.querySelector<HTMLElement>('[data-action="collected"]') ?? null;
    case "panel":
      return document.getElementById(PANEL_MESSAGE_ID) ?? panel?.querySelector<HTMLElement>("h2") ?? null;
    case "undo":
      return document.querySelector<HTMLElement>("[data-undo]");
    case "status":
      // While the panel is open, the list's status line is behind it: the panel repeats the message.
      return panelOpen ? document.getElementById(PANEL_MESSAGE_ID) : document.getElementById(STATUS_LINE_ID);
  }
}

/**
 * A2 order list with the A3 panel: filters and search, the list grouped by
 * date (and branch for the owner), refreshed every 30 seconds, and every
 * staff action with its Undo, dialogs and messages.
 */
export function AdminOrdersScreen({ owner }: AdminOrdersScreenProps) {
  const { filters, setFilters, openOrderId, setOpenOrder } = useOrderFilters(owner);
  const query = useAdminOrdersQuery(filters);
  const data = query.data;
  // Search text typed but not applied yet.
  const [pendingSearch, setPendingSearch] = useState<string | null>(null);
  // The rows on screen answer an earlier query while a new search or filter loads:
  // they're dimmed and inert, and the summary doesn't count them.
  const stale =
    listState({
      hasData: data !== undefined,
      isPlaceholderData: query.isPlaceholderData,
      isError: query.isError,
      typing: pendingSearch !== null,
    }) === "stale";

  const listRows = data?.orders ?? [];
  const fitting = listRows.filter((row) => rowFitsFilters(row, filters));
  const stable = useStableRows();
  // A held row that has left the list is kept fresh from its own detail.
  const offList = (row: AdminOrderRow | null) => (row && !listRows.some((r) => r.id === row.id) ? row.id : null);
  const focusDetail = useAdminOrderQuery(offList(stable.focusHeld)).data;
  const openDetail = useAdminOrderQuery(openOrderId).data;
  const rows = withHeldRows(fitting, [stable.focusHeld, stable.panelHeld], [...listRows, focusDetail, openDetail]);

  const { releaseOpen } = stable;
  const closePanel = useCallback(() => {
    if (openOrderId) releaseOpen(openOrderId);
    setOpenOrder(null);
  }, [openOrderId, releaseOpen, setOpenOrder]);
  const actions = useOrderActions({ closePanel });

  const filterKey = JSON.stringify(filtersToQuery(filters));
  const arrived = useArrivals(data, filterKey, query.isPlaceholderData);
  const searching = isSearching(filters);
  const groups = groupOrders(rows, data?.branches ?? [], owner && filters.branch === null);

  // Going inert would drop focus inside the list to the page: hand it to the status line.
  // (A query change starts in the filters, so this is only a safety net.)
  useEffect(() => {
    if (stale && document.activeElement?.closest(`#${ORDERS_LIST_ID}`)) document.getElementById(STATUS_LINE_ID)?.focus();
  }, [stale]);

  const { focusRequest, focusHandled } = actions;
  useEffect(() => {
    if (!focusRequest) return;
    // Collected from the panel: the URL closes it a render later, and closing hands focus
    // back to the row's Details button. Wait for that, then move to Undo.
    if (focusRequest.kind === "undo" && openOrderId) return;
    const target = focusTarget(focusRequest, rows);
    if (target) {
      target.focus();
      focusHandled();
      return;
    }
    // A row coming back (Undo) shows once the patched list renders; give it a moment.
    const fallback = window.setTimeout(() => {
      document.getElementById(STATUS_LINE_ID)?.focus();
      focusHandled();
    }, ROW_FOCUS_WAIT_MS);
    return () => window.clearTimeout(fallback);
  }, [focusRequest, focusHandled, rows, openOrderId]);

  const changeFilters = useCallback(
    (changes: Partial<AdminOrderFilters>) => {
      actions.clearMessage();
      setFilters(changes);
    },
    [actions, setFilters],
  );

  const openOrder = (row: AdminOrderRow) => {
    stable.holdOpen(row);
    actions.clearMessage();
    setOpenOrder(row.id);
  };

  const where = whereText(filters, data);
  const branchName = owner && filters.branch ? data?.branches.find((b) => b.id === filters.branch)?.name ?? null : null;
  const summary = stale
    ? staleSummary(pendingSearch ?? filters.q)
    : searching
      ? content.status.found(fitting.length, filters.q.trim())
      : content.status.summary(fitting.length, filters.status, where, branchName);
  const updated = data
    ? query.isError
      ? content.status.refreshFailed(formatMelbourneTime(data.generatedAt))
      : content.status.updated(formatMelbourneTime(data.generatedAt))
    : null;

  const openRow = openOrderId ? listRows.find((row) => row.id === openOrderId) : undefined;
  const pending = (id: OrderId | null | undefined) => (id ? actions.pendingIds.has(id) : false);

  return (
    <div className="flex flex-col">
      <h1 className="sr-only">{content.pageTitle}</h1>
      <OrderFilters
        filters={filters}
        onChange={changeFilters}
        owner={owner}
        today={data?.today ?? null}
        branches={data?.branches ?? []}
        counts={data?.counts ?? null}
        onPendingSearch={setPendingSearch}
      />
      <OrdersStatusBar
        undo={actions.undo}
        onUndo={() => void actions.undoCollect()}
        undoPending={pending(actions.undo?.orderId)}
        message={actions.message}
        onDismissMessage={actions.dismissMessage}
        summary={summary}
        updated={updated}
        arrived={arrived}
      />
      <div
        id={ORDERS_LIST_ID}
        inert={stale}
        aria-busy={stale}
        data-stale={stale || undefined}
        className="flex flex-col gap-8 px-8 pt-1 pb-12 transition-opacity data-stale:opacity-50"
      >
        {!data && query.isError ? (
          <LoadErrorNotice
            retryLabel={content.load.retry}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          >
            {content.load.failed}
          </LoadErrorNotice>
        ) : !data || (stale && groups.length === 0) ? (
          <LoadingMessage>{stale ? summary : content.load.loading}</LoadingMessage>
        ) : groups.length === 0 ? (
          <OrdersEmpty
            filters={filters}
            where={where}
            onClearSearch={() => {
              changeFilters({ q: "" });
              focusFilter(SEARCH_FIELD_ID);
            }}
            onShowAllDates={() => {
              changeFilters({ date: "all" });
              focusFilter(ALL_DATES_BUTTON_ID);
            }}
          />
        ) : (
          <>
            <OrderGroups
              groups={groups}
              today={data.today}
              tomorrow={data.tomorrow}
              showReadyCount={!searching && filters.status === "todo"}
              openOrderId={openOrderId}
              onReady={(row) => void actions.markReady(row, "row")}
              onCollected={(row) => void actions.collect(row, "row")}
              onOpen={openOrder}
              onFocusRow={stable.holdFocused}
            />
            {data.capped && !stale && <p className="text-ink-muted">{content.status.capped}</p>}
          </>
        )}
      </div>

      <OrderPanel
        orderId={openOrderId}
        orderNumber={openRow?.orderNumber ?? null}
        onClose={closePanel}
        pending={pending(openOrderId)}
        message={actions.message}
        onDismissMessage={actions.dismissMessage}
        onReady={(order) => void actions.markReady(order, "panel")}
        onCollected={(order) => void actions.collect(order, "panel")}
        onCancel={actions.openCancel}
        onMarkRefunded={(order) => void actions.markRefunded(order)}
      />
      <ConfirmPaymentDialog
        order={actions.confirming}
        pending={pending(actions.confirming?.id)}
        onConfirm={() => void actions.confirmPaid()}
        onClose={actions.closeConfirm}
      />
      <CancelOrderDialog
        order={actions.cancelling}
        pending={pending(actions.cancelling?.id)}
        onSubmit={actions.cancel}
        onClose={actions.closeCancel}
      />
    </div>
  );
}
