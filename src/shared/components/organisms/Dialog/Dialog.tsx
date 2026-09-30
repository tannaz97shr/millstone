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
  /**
   * Buttons. Customer: stacked, full width. Admin: in a row, the first one grows and
   * the others keep their natural width. Labels never wrap and no button shrinks
   * below its label; if the row doesn't fit, the next button drops to a new line.
   */
  actions?: React.ReactNode;
  /**
   * Admin spacing, from the A2/A3 designs. form: 640px wide, 120px from the top
   * (cancel an order). confirm: 600px wide, 180px from the top, a flat 16px rhythm
   * (has the customer paid?). No effect on the customer site.
   */
  adminLayout?: "form" | "confirm";
  className?: string;
}

const adminLayouts = {
  form: {
    backdrop: "admin:pt-30",
    panel: "admin:max-w-160 admin:gap-5",
    heading: "",
    actions: "admin:mt-1",
  },
  confirm: {
    backdrop: "admin:pt-45",
    panel: "admin:max-w-150 admin:gap-4",
    heading: "admin:gap-4",
    actions: "admin:mt-2",
  },
} as const;

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
  adminLayout = "form",
  className,
}: DialogProps) {
  const layout = adminLayouts[adminLayout];
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
      className={cx(
        "fixed inset-0 m-0 h-full max-h-none w-full max-w-none flex-col items-center justify-center bg-ink/45 p-4 text-ink open:flex admin:justify-start admin:bg-ink/50",
        layout.backdrop,
      )}
    >
      {open && (
        <div
          className={cx(
            "flex max-h-full w-full max-w-100 flex-col gap-4 overflow-y-auto rounded-lg bg-flour-raised px-5 pt-6 pb-5 shadow-sheet",
            "admin:p-8",
            layout.panel,
            className,
          )}
        >
          {eyebrow && <div className="flex flex-wrap items-center gap-3">{eyebrow}</div>}
          <div className={cx("flex flex-col gap-2", layout.heading)}>
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
            <div
              className={cx(
                "flex flex-col gap-2 [&>*]:w-full [&>*]:whitespace-nowrap",
                "admin:flex-row admin:flex-wrap admin:gap-3 admin:[&>*]:w-auto admin:[&>*]:shrink-0 admin:[&>*:first-child]:grow",
                layout.actions,
              )}
            >
              {actions}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
