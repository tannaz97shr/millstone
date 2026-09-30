"use client";

import { useRef } from "react";
import { componentsContent } from "@/shared/content/components";
import { cx } from "@/shared/utils/cx";
import { focusWithoutTabStop, nextFocusableAfter } from "@/shared/utils/focusable";
import { Button } from "../../atoms/Button/Button";
import { Icon, type IconName } from "../../atoms/Icon/Icon";

export type NoticeTone = "neutral" | "success" | "warning" | "error" | "info";

export interface NoticeProps {
  /**
   * neutral: plain message ("We took … out of your order").
   * success: sage, e.g. "MS-1043 collected" with Undo.
   * warning: wheat, generation notes and cautions.
   * error: brick, announced as an alert.
   * info: a rule to know (admin product form). Plain flour with a line-strong
   *   edge: delft stays reserved for Recurring and focus.
   */
  tone?: NoticeTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Defaults to check for success, alert otherwise. */
  icon?: IconName;
  /** A button beside the message, e.g. Undo. */
  action?: React.ReactNode;
  /** Shows an "OK" button that dismisses the message. */
  onDismiss?: () => void;
  /**
   * Where focus goes when the message is dismissed. Without it, focus moves to
   * the next focusable element after the notice, or to the notice's parent.
   */
  focusAfterDismiss?: React.RefObject<HTMLElement | null>;
  /** Defaults to alert for error, status otherwise. */
  role?: "status" | "alert" | "note";
  className?: string;
}

const toneClasses: Record<NoticeTone, string> = {
  neutral: "bg-flour-raised border-line-strong text-ink",
  success: "bg-sage-soft border-sage text-ink",
  warning: "bg-wheat-soft border-wheat text-wheat-ink",
  error: "bg-brick-soft border-brick text-ink",
  info: "bg-flour border-line-strong text-ink",
};

const iconToneClasses: Record<NoticeTone, string> = {
  neutral: "text-ink",
  success: "text-sage",
  warning: "text-wheat-ink",
  error: "text-brick",
  info: "text-ink",
};

const titleToneClasses: Record<NoticeTone, string> = {
  neutral: "",
  success: "",
  warning: "",
  error: "text-brick",
  info: "",
};

/** An inline message with an icon and words. Never colour alone. */
export function Notice({
  tone = "neutral",
  title,
  children,
  icon,
  action,
  onDismiss,
  focusAfterDismiss,
  role,
  className,
}: NoticeProps) {
  const iconName = icon ?? (tone === "success" ? "check" : "alert");
  // A plain notice with a check (e.g. "Your account is set up") shows it in sage.
  const iconColour = tone === "neutral" && iconName === "check" ? "text-sage" : iconToneClasses[tone];

  const rootRef = useRef<HTMLDivElement>(null);

  // The OK button is about to disappear with the notice. Move focus first, so
  // it never falls back to the top of the page.
  const dismiss = () => {
    const root = rootRef.current;
    const target = focusAfterDismiss?.current ?? (root ? nextFocusableAfter(root) : null);
    if (target) target.focus();
    else if (root?.parentElement) focusWithoutTabStop(root.parentElement);
    onDismiss?.();
  };

  return (
    <div
      ref={rootRef}
      role={role ?? (tone === "error" ? "alert" : "status")}
      className={cx(
        "flex items-center gap-3 rounded-md border-(length:--control-border) py-3 pr-3 pl-4 admin:py-4 admin:pr-4 admin:pl-5",
        toneClasses[tone],
        className,
      )}
    >
      {/* Icon and words stay together: the icon sits on the first line, the pair centres against a button. */}
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className={cx("flex pt-0.5 text-[20px] admin:text-[24px]", iconColour)}>
          <Icon name={iconName} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1 text-[16px]/[24px] admin:text-[18px]/[26px]">
          {title && (
            <p className={cx("font-bold admin:text-[20px]/[28px]", titleToneClasses[tone])}>
              {title}
            </p>
          )}
          {children && <div>{children}</div>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {onDismiss && (
        <Button
          variant="quiet"
          onClick={dismiss}
          aria-label={componentsContent.notice.dismissLabel}
          className="shrink-0"
        >
          {componentsContent.notice.dismiss}
        </Button>
      )}
    </div>
  );
}
