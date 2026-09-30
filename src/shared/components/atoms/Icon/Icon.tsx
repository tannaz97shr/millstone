import { cx } from "@/shared/utils/cx";

export const ICON_NAMES = [
  "check",
  "cross",
  "ring",
  "repeat",
  "note",
  "alert",
  "plus",
  "minus",
  "left",
  "right",
  "refund",
] as const;
export type IconName = (typeof ICON_NAMES)[number];

// Path data from the design system's own icon set (design/system/components/bundle.js):
// 24px grid, drawn with a 2.25 round stroke in currentColor.
const shapes: Record<IconName, React.ReactNode> = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  cross: (
    <>
      <path d="M6.5 6.5l11 11" />
      <path d="M17.5 6.5l-11 11" />
    </>
  ),
  ring: <circle cx={12} cy={12} r={6.5} />,
  repeat: (
    <>
      <path d="M17 3l3 3-3 3" />
      <path d="M4 12v-1a5 5 0 0 1 5-5h11" />
      <path d="M7 21l-3-3 3-3" />
      <path d="M20 12v1a5 5 0 0 1-5 5H4" />
    </>
  ),
  // A banknote: the Unpaid label's mark.
  note: (
    <>
      <rect x={2.5} y={6} width={19} height={12} rx={2} />
      <circle cx={12} cy={12} r={2.5} />
    </>
  ),
  alert: (
    <>
      <path d="M12 7.5v6" />
      <path d="M12 17v.01" />
      <circle cx={12} cy={12} r={9} />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  left: <path d="M15 5l-7 7 7 7" />,
  right: <path d="M9 5l7 7-7 7" />,
  refund: (
    <>
      <path d="M9 5L4.5 9.5 9 14" />
      <path d="M4.5 9.5H14a5 5 0 0 1 0 10h-3" />
    </>
  ),
};

export interface IconProps {
  name: IconName;
  className?: string;
}

/** Decorative only: every icon sits next to a word, so it is hidden from screen readers. */
export function Icon({ name, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx("size-[1em] shrink-0", className)}
    >
      {shapes[name]}
    </svg>
  );
}
