"use client";

import { Button } from "@/shared/components/atoms/Button/Button";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { adminOrdersContent } from "../content/adminOrdersContent";
import type { StatusMessage, UndoState } from "../hooks/useOrderActions";

const content = adminOrdersContent;

export const STATUS_LINE_ID = "orders-status";

export interface OrdersStatusBarProps {
  undo: UndoState | null;
  onUndo: () => void;
  undoPending: boolean;
  message: StatusMessage | null;
  onDismissMessage: () => void;
  /** "6 orders to do" or "2 found for …". */
  summary: string;
  /** "Updated 9:41am. New orders appear here by themselves.", or the refresh failure. */
  updated: string | null;
  arrived: string[];
}

/**
 * The line between the filters and the list (A2): the Undo after a one-tap
 * Collected, else the last action's message, else the count; on the right,
 * when the list last refreshed and what just came in.
 */
export function OrdersStatusBar({
  undo,
  onUndo,
  undoPending,
  message,
  onDismissMessage,
  summary,
  updated,
  arrived,
}: OrdersStatusBarProps) {
  const arrivedText =
    arrived.length === 0
      ? null
      : arrived.length === 1
        ? content.status.arrivedOne(arrived[0])
        : content.status.arrivedMany(arrived);

  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-6 gap-y-3 px-8 py-3.5">
      {undo ? (
        <Notice
          tone="success"
          className="py-1! pr-1! pl-4!"
          action={
            <Button
              variant="secondary"
              icon="refund"
              data-undo
              aria-label={content.messages.undoLabel(undo.orderNumber, content.statusWord[undo.previousStatus])}
              aria-disabled={undoPending || undefined}
              onClick={() => !undoPending && onUndo()}
            >
              {content.messages.undo}
            </Button>
          }
        >
          <strong className="text-[20px]/[28px]">{content.messages.collected(undo.orderNumber)}</strong>
        </Notice>
      ) : message ? (
        <Notice
          tone={message.tone}
          className="py-1.5! pl-3!"
          onDismiss={message.tone === "error" ? onDismissMessage : undefined}
        >
          <span id={STATUS_LINE_ID} tabIndex={-1} className="font-bold focus-visible:shadow-none">
            {message.text}
          </span>
        </Notice>
      ) : (
        <p id={STATUS_LINE_ID} tabIndex={-1} className="text-[18px]/[24px] font-bold focus-visible:shadow-none">
          {summary}
        </p>
      )}
      {updated && (
        <p className="flex items-center gap-2.5 text-[16px]/[22px] text-ink-muted">
          <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-sage" />
          <span aria-live="polite">
            {arrivedText && (
              <>
                <strong className="text-ink">{arrivedText}</strong> ·{" "}
              </>
            )}
          </span>
          {updated}
        </p>
      )}
    </div>
  );
}
