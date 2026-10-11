"use client";

import { useEffect, useRef } from "react";
import { OrderCall } from "@/modules/account/components/OrderCall";
import { Button } from "@/shared/components/atoms/Button/Button";
import type { IsoDate } from "@/shared/domain";
import { cx } from "@/shared/utils/cx";
import { formatPickupDay, formatTimeOfDay } from "@/shared/utils/pickup-dates";
import { recurringContent } from "../content/recurringContent";
import type { FocusTarget } from "../hooks/useRecurringActions";
import { dayLabel, noUpcomingText, rowCaption } from "../lib/recurringText";
import type { RecurringOrderDetail } from "../types/recurringOrderView";

const content = recurringContent.detail;

export interface UpcomingPickupsProps {
  detail: RecurringOrderDetail;
  onSkip: (date: IsoDate) => void;
  onUndo: (date: IsoDate) => void;
  /** The row a skip or undo is running for: its button waits. */
  pendingDate: IsoDate | null;
  /** After a skip or undo, focus moves to that row's other button once it shows. */
  focusTarget: FocusTarget | null;
  onFocused: () => void;
}

/** C12 "Upcoming pickups" (AC-R5, R7): made and closing rows are locked; open ones skip, skipped ones undo. */
export function UpcomingPickups({ detail, onSkip, onUndo, pendingDate, focusTarget, onFocused }: UpcomingPickupsProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const empty = noUpcomingText(detail);

  // The answer can render a moment after the request settles: wait for the
  // row's new button (Undo after a skip, Skip after an undo), not the old one.
  useEffect(() => {
    if (!focusTarget) return;
    const button = listRef.current?.querySelector<HTMLButtonElement>(
      `[data-row-date="${focusTarget.date}"][data-row-kind="${focusTarget.kind}"]`,
    );
    if (!button) return;
    button.focus();
    onFocused();
  }, [focusTarget, detail, onFocused]);

  return (
    <section aria-labelledby="upcoming-title" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="upcoming-title" className="section-title">
          {content.upcomingTitle}
        </h2>
        <p className="caption text-ink-muted">{content.upcomingNote(formatTimeOfDay(detail.branch.orderCutoffTime))}</p>
      </div>
      <ul ref={listRef} className="flex flex-col rounded-lg border border-line bg-flour-raised shadow-card">
        {detail.upcoming.map((row, index) => {
          const caption = rowCaption(row, detail.branch);
          const day = formatPickupDay(row.date);
          const busy = pendingDate === row.date;
          return (
            <li
              key={row.date}
              className={cx("flex min-h-18 items-center justify-between gap-3 px-4 py-3", index > 0 && "border-t border-line")}
            >
              <div className="flex min-w-0 flex-col">
                <span
                  className={cx("body-strong", row.kind === "skipped" && "text-ink-muted line-through decoration-2")}
                >
                  {dayLabel(row.date, detail.today)}
                </span>
                <span className="caption text-ink-muted">
                  {caption.kind === "call" ? (
                    <OrderCall before={caption.before} phone={detail.branch.phone} after={content.callAfter} />
                  ) : (
                    caption.text
                  )}
                </span>
              </div>
              {row.kind === "open" && (
                <Button
                  variant="secondary"
                  data-row-date={row.date}
                  data-row-kind="open"
                  aria-label={content.skipLabel(day)}
                  aria-disabled={busy || undefined}
                  onClick={() => !busy && onSkip(row.date)}
                  className="shrink-0"
                >
                  {content.skip}
                </Button>
              )}
              {row.kind === "skipped" && (
                <Button
                  variant="secondary"
                  icon="refund"
                  data-row-date={row.date}
                  data-row-kind="skipped"
                  aria-label={content.undoLabel(day)}
                  aria-disabled={busy || undefined}
                  onClick={() => !busy && onUndo(row.date)}
                  className="shrink-0"
                >
                  {content.undo}
                </Button>
              )}
            </li>
          );
        })}
        {empty && (
          <li className={cx("p-4 text-ink-muted", detail.upcoming.length > 0 && "border-t border-line")}>{empty}</li>
        )}
      </ul>
    </section>
  );
}
