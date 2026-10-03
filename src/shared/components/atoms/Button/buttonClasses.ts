import { cx } from "@/shared/utils/cx";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger" | "ready";

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
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

// not-disabled: hover styles for both <button> (enabled) and <a> (never disabled).
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-crust border-crust text-on-crust not-disabled:hover:bg-crust-deep not-disabled:hover:border-crust-deep not-disabled:active:bg-crust-deep",
  secondary: "bg-flour-raised border-line-strong text-ink not-disabled:hover:bg-flour-sunk",
  quiet:
    "bg-transparent border-transparent text-crust underline underline-offset-3 decoration-[1.5px] not-disabled:hover:bg-crust-soft",
  danger: "bg-flour-raised border-brick text-brick not-disabled:hover:bg-brick-soft",
  ready:
    "bg-sage border-sage text-on-sage not-disabled:hover:bg-sage-deep not-disabled:hover:border-sage-deep",
};

const counterClasses = "admin:min-h-action admin:min-w-45 admin:text-[22px]";

/** The Button look, shared by <Button> and <ButtonLink>. */
export function buttonClasses({
  variant = "secondary",
  block = false,
  counter = false,
}: ButtonStyleOptions): string {
  return cx(
    base,
    block ? "flex w-full" : "inline-flex",
    variantClasses[variant],
    counter && counterClasses,
  );
}
