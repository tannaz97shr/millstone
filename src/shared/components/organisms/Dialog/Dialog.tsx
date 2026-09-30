"use client";

import { useId } from "react";
import { useModalDialog } from "@/shared/hooks/useModalDialog";
import { cx } from "@/shared/utils/cx";

export interface DialogProps {
  open: boolean;
  /** Escape and a tap outside call this: the same as the keep / not-yet button. */
  onClose: () => void;
  title: React.ReactNode;
  /** alertdialog for a warning that needs an answer (e.g. "Change to Fitzroy?"). */
  role?: "dialog" | "alertdialog";
  /** Above the title, e.g. the order number and its Unpaid label. */
  eyebrow?: React.ReactNode;
  /** The sentence under the title; read out with it. */
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Buttons: stacked on the customer site, in a row on the admin with the first one widest. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * A plain modal dialog. Customer: centred with a 16px gutter. Admin
 * (data-context="admin"): wider, near the top of the screen, counter-size type.
 * The page behind is inert and doesn't scroll.
 */
export function Dialog({
  open,
  onClose,
  title,
  role = "dialog",
  eyebrow,
  description,
  children,
  actions,
  className,
}: DialogProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const { dialogRef, titleRef } = useModalDialog({ open, onClose });

  return (
    <dialog
      ref={dialogRef}
      data-modal
      role={role}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none flex-col items-center justify-center bg-ink/45 p-4 text-ink open:flex admin:justify-start admin:bg-ink/50 admin:pt-30"
    >
      {open && (
        <div
          className={cx(
            "flex max-h-full w-full max-w-100 flex-col gap-4 overflow-y-auto rounded-lg bg-flour-raised px-5 pt-6 pb-5 shadow-sheet",
            "admin:max-w-160 admin:gap-5 admin:p-8",
            className,
          )}
        >
          {eyebrow && <div className="flex flex-wrap items-center gap-3">{eyebrow}</div>}
          <div className="flex flex-col gap-2">
            <h2
              ref={titleRef}
              id={titleId}
              tabIndex={-1}
              className="section-title focus-visible:shadow-none admin:admin-title"
            >
              {title}
            </h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          {children}
          {actions && (
            <div className="flex flex-col gap-2 admin:mt-1 admin:flex-row admin:gap-3 admin:[&>*:first-child]:flex-1">
              {actions}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
