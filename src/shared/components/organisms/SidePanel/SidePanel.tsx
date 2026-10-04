"use client";

import { useId } from "react";
import { useModalDialog } from "@/shared/hooks/useModalDialog";
import { cx } from "@/shared/utils/cx";
import { Button } from "../../atoms/Button/Button";

export interface SidePanelProps {
  /** On the <dialog>, so a screen can find the panel (e.g. to move focus into it). */
  id?: string;
  open: boolean;
  /** Close, Escape and a tap on the dimmed list all call this. */
  onClose: () => void;
  /** The heading, e.g. the order number. */
  title: React.ReactNode;
  /** Classes for the heading; defaults to the admin title style. */
  titleClassName?: string;
  /** Under the heading, in the fixed top band: labels, a one-line summary. */
  header?: React.ReactNode;
  closeLabel: string;
  /** The scrolling middle. */
  children?: React.ReactNode;
  /** The fixed bottom band, for the actions. */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * The admin side panel (A3 order detail, A5 product form): 600px on the
 * right, under the 80px admin header, over a dimmed list. Modal: the page
 * behind is inert, focus goes to the heading and comes back on close.
 */
export function SidePanel({
  id,
  open,
  onClose,
  title,
  titleClassName = "admin-title",
  header,
  closeLabel,
  children,
  footer,
  className,
}: SidePanelProps) {
  const titleId = useId();
  const { dialogRef, titleRef } = useModalDialog({ open, onClose });

  return (
    <dialog
      ref={dialogRef}
      id={id}
      data-modal
      aria-labelledby={titleId}
      className="fixed inset-x-0 top-20 bottom-0 m-0 h-auto max-h-none w-full max-w-none justify-end bg-ink/25 p-0 text-ink backdrop:bg-transparent open:flex"
    >
      {open && (
        <div
          className={cx(
            "flex h-full w-150 max-w-full flex-col border-l-2 border-line bg-flour-raised shadow-sheet",
            className,
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b-2 border-line px-8 pt-6 pb-5">
            <div className="flex min-w-0 flex-col gap-3">
              <h2
                ref={titleRef}
                id={titleId}
                tabIndex={-1}
                className={cx("focus-visible:shadow-none", titleClassName)}
              >
                {title}
              </h2>
              {header}
            </div>
            <Button variant="secondary" icon="cross" onClick={onClose} className="shrink-0">
              {closeLabel}
            </Button>
          </div>
          <div className="flex grow flex-col gap-7 overflow-y-auto px-8 py-6">{children}</div>
          {footer && (
            <div className="flex shrink-0 flex-col gap-3 border-t-2 border-line bg-flour-raised px-8 pt-5 pb-6">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
