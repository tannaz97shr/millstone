import { cx } from "@/shared/utils/cx";

export type BottomBarTone = "raised" | "warm";

export interface BottomBarProps {
  /** raised: a plain action (C1 "See the menu"). warm: the order summary (C2). */
  tone?: BottomBarTone;
  /** Makes it a labelled region, e.g. "Your order". */
  "aria-label"?: string;
  className?: string;
  children: React.ReactNode;
}

const toneClasses: Record<BottomBarTone, string> = {
  raised: "bg-flour-raised",
  warm: "bg-crust-soft",
};

/**
 * The customer's sticky bar at the bottom of the screen. Place it last in the
 * page: it spans the page gutter and sits on the bottom of the viewport while
 * the content scrolls behind it.
 */
export function BottomBar({ tone = "raised", className, children, ...aria }: BottomBarProps) {
  return (
    <div
      role={aria["aria-label"] ? "region" : undefined}
      {...aria}
      className={cx(
        "sticky bottom-0 z-10 -mx-4 mt-auto -mb-8 border-t border-line px-4 pt-3 pb-4 shadow-bar",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
