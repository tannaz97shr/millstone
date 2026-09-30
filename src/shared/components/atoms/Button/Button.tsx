import { cx } from "@/shared/utils/cx";
import { Icon, type IconName } from "../Icon/Icon";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger" | "ready";

export interface ButtonProps extends React.ComponentPropsWithRef<"button"> {
  variant?: ButtonVariant;
  icon?: IconName;
  /** Full width, e.g. the mobile checkout button. */
  block?: boolean;
  /** Admin only: the 72px Ready / Collected button on an order row. */
  counter?: boolean;
}

// Height, text size and edge width come from data-context; never set by hand.
const base =
  "items-center justify-center gap-2 min-h-control min-w-tap px-control-x rounded-md " +
  "border-(length:--control-border) text-control font-bold " +
  "cursor-pointer transition-colors duration-[120ms] " +
  "disabled:cursor-not-allowed disabled:bg-flour-sunk disabled:border-flour-sunk disabled:text-ink-muted";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-crust border-crust text-on-crust enabled:hover:bg-crust-deep enabled:hover:border-crust-deep enabled:active:bg-crust-deep",
  secondary: "bg-flour-raised border-line-strong text-ink enabled:hover:bg-flour-sunk",
  quiet:
    "bg-transparent border-transparent text-crust underline underline-offset-3 decoration-[1.5px] enabled:hover:bg-crust-soft",
  danger: "bg-flour-raised border-brick text-brick enabled:hover:bg-brick-soft",
  ready:
    "bg-sage border-sage text-on-sage enabled:hover:bg-sage-deep enabled:hover:border-sage-deep",
};

const counterClasses = "admin:min-h-action admin:min-w-45 admin:text-[22px]";

export function Button({
  variant = "secondary",
  icon,
  block = false,
  counter = false,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        base,
        block ? "flex w-full" : "inline-flex",
        variantClasses[variant],
        counter && counterClasses,
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}
