"use client";

import { useId } from "react";
import { useModalDialog } from "@/shared/hooks/useModalDialog";
import { cx } from "@/shared/utils/cx";

export interface SheetProps {
  open: boolean;
  /** Escape and a tap outside call this: the same as the sheet's cancel button. */
  onClose: () => void;
  title: React.ReactNode;
  children?: React.ReactNode;
  /** Buttons, stacked full width. Put the primary first and the cancel button last. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * The customer bottom sheet (change branch, product detail, end a recurring
 * order). Modal: the page behind is inert and doesn't scroll.
 */
export function Sheet({ open, onClose, title, children, actions, className }: SheetProps) {
  const titleId = useId();
  const { dialogRef, titleRef } = useModalDialog({ open, onClose });

  return (
    <dialog
      ref={dialogRef}
      data-modal
      aria-labelledby={titleId}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none flex-col justify-end bg-ink/45 p-0 text-ink open:flex"
    >
      {open && (
        <div
          className={cx(
            "mx-auto flex max-h-[92%] w-full max-w-120 flex-col gap-4 overflow-y-auto rounded-t-lg bg-flour-raised px-4 pt-6 pb-5 shadow-sheet",
            className,
          )}
        >
          <h2
            ref={titleRef}
            id={titleId}
            tabIndex={-1}
            className="section-title focus-visible:shadow-none"
          >
            {title}
          </h2>
          {children}
          {actions && <div className="flex flex-col gap-2">{actions}</div>}
        </div>
      )}
    </dialog>
  );
}
