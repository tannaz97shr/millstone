import { cx } from "@/shared/utils/cx";
import { Icon, type IconName } from "../Icon/Icon";

export type StampShape = "pill" | "tag";

export interface StampProps {
  /** pill: order status only. tag: square-cornered, uppercase (payment, recurring). */
  shape: StampShape;
  icon: IconName;
  /** Colour and edge classes for this stamp. */
  toneClassName: string;
  /** Keep the words as written (RecurringLabel); tags are uppercase otherwise. */
  plainCase?: boolean;
  title?: string;
  className?: string;
  children: React.ReactNode;
}

const shapeClasses: Record<StampShape, string> = {
  pill: "rounded-full px-[0.75em]",
  tag: "rounded-sm px-[0.6em]",
};

/**
 * The shared base of StatusBadge, PaymentLabel, RecurringLabel and
 * RecurringStatusTag: an icon and one word, sized from data-context.
 */
export function Stamp({
  shape,
  icon,
  toneClassName,
  plainCase = false,
  title,
  className,
  children,
}: StampProps) {
  return (
    <span
      title={title}
      className={cx(
        "inline-flex h-badge items-center gap-[0.4em] whitespace-nowrap border-(length:--control-border) text-badge font-bold",
        shapeClasses[shape],
        shape === "tag" && !plainCase && "uppercase tracking-[0.04em]",
        toneClassName,
        className,
      )}
    >
      <Icon name={icon} sizeClassName="size-[1.05em]" />
      {children}
    </span>
  );
}
