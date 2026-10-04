"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { OrderId, UndoableStatus, VisibleOrderStatus } from "@/shared/domain";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { logError } from "@/shared/utils/logError";
import { postOrderAction } from "../api/adminOrdersApi";
import { adminOrderKeys } from "../api/queryKeys";
import { adminOrdersContent as content } from "../content/adminOrdersContent";
import { type OrderActionRequest, UNDO_VISIBLE_MS } from "../lib/orderActionSchema";
import type { AdminOrderDetail, AdminOrderList, AdminOrderRow } from "../types/adminOrder";

/** Where focus goes once an action is done, so a keyboard user never lands on <body>. */
export type FocusRequest =
  | { kind: "row-collected"; orderId: OrderId }
  | { kind: "panel-collected" }
  | { kind: "panel" }
  | { kind: "undo" }
  | { kind: "status" };

export interface UndoState {
  orderId: OrderId;
  orderNumber: string;
  previousStatus: UndoableStatus;
}

export interface StatusMessage {
  tone: "success" | "error";
  text: string;
}

/** The order an action is about; a list row or the open order's detail. */
export type ActionTarget = Pick<
  AdminOrderRow,
  "id" | "orderNumber" | "status" | "paymentStatus" | "paymentMethod" | "contactName" | "totalCents" | "pickupDate"
>;

type Where = "row" | "panel";

export interface CancelInput {
  reason: "not_collected" | "customer_request" | "other";
  note?: string;
}

interface UseOrderActionsOptions {
  /** A paid Collected from the panel closes it (the Undo message is behind it). */
  closePanel: () => void;
}

const word = (status: VisibleOrderStatus | undefined) => (status ? content.statusWord[status] : "");

/**
 * Every A2/A3 action: one request each, the cache patched with the server's
 * answer, then the list and the order refetched. Owns the one Undo (a new
 * action replaces it), the message under the filters, the two dialogs, and
 * where focus goes afterwards.
 */
export function useOrderActions({ closePanel }: UseOrderActionsOptions) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ orderId, action }: { orderId: OrderId; action: OrderActionRequest }) =>
      postOrderAction(orderId, action),
    retry: false,
  });

  const [pendingIds, setPendingIds] = useState<ReadonlySet<OrderId>>(new Set());
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [message, setMessage] = useState<StatusMessage | null>(null);
  const [confirming, setConfirming] = useState<{ order: ActionTarget; where: Where } | null>(null);
  const [cancelling, setCancelling] = useState<ActionTarget | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);

  // The Undo message goes after ~5s. If it had focus, focus moves to the status line.
  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => {
      if (document.activeElement?.closest("[data-undo]")) setFocusRequest({ kind: "status" });
      setUndo(null);
    }, UNDO_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [undo]);

  const applyResult = useCallback(
    (order: AdminOrderDetail) => {
      queryClient.setQueryData(adminOrderKeys.detail(order.id), order);
      queryClient.setQueriesData<AdminOrderList>({ queryKey: adminOrderKeys.lists() }, (list) =>
        list && {
          ...list,
          orders: list.orders.map((row) =>
            row.id === order.id
              ? { ...row, status: order.status, paymentStatus: order.paymentStatus, paymentLabel: order.paymentLabel }
              : row,
          ),
        },
      );
    },
    [queryClient],
  );

  const refresh = useCallback(
    (orderId: OrderId) => {
      void queryClient.invalidateQueries({ queryKey: adminOrderKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(orderId) });
    },
    [queryClient],
  );

  /** Sends one action; null when it was refused (the message says why) or already in flight. */
  const send = useCallback(
    async (target: Pick<ActionTarget, "id" | "orderNumber">, action: OrderActionRequest) => {
      if (pendingIds.has(target.id)) return null;
      setPendingIds((ids) => new Set(ids).add(target.id));
      try {
        const result = await mutation.mutateAsync({ orderId: target.id, action });
        applyResult(result.order);
        return result;
      } catch (error) {
        logError(error, `order action ${action.action} ${target.orderNumber}`, { level: "warn" });
        const failure = toApiFailure(error);
        const number = failure.orderNumber ?? target.orderNumber;
        const text =
          failure.code === "undo_expired"
            ? content.messages.undoExpired(number)
            : failure.code === "order_changed" ||
                failure.code === "not_allowed" ||
                failure.code === "payment_unconfirmed" ||
                failure.code === "not_found"
              ? content.messages.changed(number, word(failure.currentStatus) || "off this list")
              : failure.code === "unavailable"
                ? content.messages.unavailable
                : content.messages.failed;
        setUndo(null);
        setMessage({ tone: "error", text });
        setFocusRequest({ kind: "status" });
        return null;
      } finally {
        setPendingIds((ids) => {
          const next = new Set(ids);
          next.delete(target.id);
          return next;
        });
        refresh(target.id);
      }
    },
    [applyResult, mutation, pendingIds, refresh],
  );

  const succeed = useCallback((text: string, focus: FocusRequest) => {
    setUndo(null);
    setMessage({ tone: "success", text });
    setFocusRequest(focus);
  }, []);

  const markReady = useCallback(
    async (order: ActionTarget, where: Where) => {
      const result = await send(order, { action: "ready", expectedStatus: order.status });
      if (!result) return;
      succeed(
        content.messages.ready(order.orderNumber),
        where === "row" ? { kind: "row-collected", orderId: order.id } : { kind: "panel-collected" },
      );
    },
    [send, succeed],
  );

  const collect = useCallback(
    async (order: ActionTarget, where: Where) => {
      if (order.paymentStatus !== "paid") {
        setConfirming({ order, where });
        return;
      }
      if (order.status !== "placed" && order.status !== "ready") return;
      const previousStatus = order.status;
      const result = await send(order, { action: "collect", expectedStatus: order.status, paymentConfirmed: false });
      if (!result) return;
      if (where === "panel") closePanel();
      setMessage(null);
      setUndo({ orderId: order.id, orderNumber: order.orderNumber, previousStatus });
      setFocusRequest({ kind: "undo" });
    },
    [closePanel, send],
  );

  const confirmPaid = useCallback(async () => {
    if (!confirming) return;
    const { order, where } = confirming;
    const result = await send(order, { action: "collect", expectedStatus: order.status, paymentConfirmed: true });
    setConfirming(null);
    if (!result) return;
    succeed(content.messages.paidAndCollected(order.orderNumber), where === "panel" ? { kind: "panel" } : { kind: "status" });
  }, [confirming, send, succeed]);

  const undoCollect = useCallback(async () => {
    if (!undo) return;
    const current = undo;
    const result = await send({ id: current.orderId, orderNumber: current.orderNumber }, { action: "undo_collect" });
    if (!result) return;
    succeed(content.messages.backIn(current.orderNumber, word(current.previousStatus)), {
      kind: "row-collected",
      orderId: current.orderId,
    });
  }, [send, succeed, undo]);

  const cancel = useCallback(
    async (input: CancelInput) => {
      if (!cancelling) return false;
      const order = cancelling;
      const result = await send(order, {
        action: "cancel",
        expectedStatus: order.status,
        reason: input.reason,
        note: input.reason === "other" ? input.note : undefined,
      });
      setCancelling(null);
      if (!result) return false;
      const refundDue = order.paymentMethod === "online" && order.paymentStatus === "paid";
      succeed(content.messages.cancelled(order.orderNumber, refundDue), { kind: "panel" });
      return true;
    },
    [cancelling, send, succeed],
  );

  const markRefunded = useCallback(
    async (order: ActionTarget) => {
      const result = await send(order, { action: "mark_refunded" });
      if (!result) return;
      succeed(content.messages.refunded(order.orderNumber), { kind: "panel" });
    },
    [send, succeed],
  );

  return {
    pendingIds,
    undo,
    message,
    dismissMessage: () => setMessage(null),
    /** Changing a filter clears the last message (A2 design); a running Undo stays. */
    clearMessage: () => setMessage(null),
    confirming: confirming?.order ?? null,
    closeConfirm: () => setConfirming(null),
    cancelling,
    openCancel: (order: ActionTarget) => setCancelling(order),
    closeCancel: () => setCancelling(null),
    focusRequest,
    focusHandled: () => setFocusRequest(null),
    markReady,
    collect,
    confirmPaid,
    undoCollect,
    cancel,
    markRefunded,
  };
}
