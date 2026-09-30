"use client";

import { componentsContent } from "@/shared/content/components";
import { useControllableState } from "@/shared/hooks/useControllableState";
import { cx } from "@/shared/utils/cx";
import { Icon } from "../../atoms/Icon/Icon";

export interface QuantityStepperProps {
  value?: number;
  defaultValue?: number;
  onChange?: (n: number) => void;
  min?: number;
  max?: number;
  /** The product name, for labels like "One more Plain bagel". */
  label?: string;
  className?: string;
}

const content = componentsContent.quantityStepper;

// The group clips its corners, so focus is drawn inside the button.
const stepButton =
  "flex w-tap cursor-pointer items-center justify-center text-[calc(var(--control-text)+4px)] text-crust " +
  "enabled:hover:bg-crust-soft focus-visible:shadow-[inset_0_0_0_3px_var(--color-delft)] " +
  "disabled:cursor-not-allowed disabled:text-line-strong";

/** Minus / count / plus. Going to 0 removes the item, so minus says "Remove" at 1. */
export function QuantityStepper({
  value,
  defaultValue = 1,
  onChange,
  min = 0,
  max = 99,
  label,
  className,
}: QuantityStepperProps) {
  const [count, setCount] = useControllableState({ value, defaultValue, onChange });
  const step = (by: number) => setCount(Math.max(min, Math.min(max, count + by)));

  return (
    <div
      role="group"
      aria-label={content.group(label)}
      className={cx(
        "inline-flex h-control items-stretch overflow-hidden rounded-md border-(length:--control-border) border-line-strong bg-flour-raised",
        className,
      )}
    >
      <button
        type="button"
        className={stepButton}
        disabled={count <= min}
        onClick={() => step(-1)}
        aria-label={count - 1 <= 0 ? content.remove(label) : content.fewer(label)}
      >
        <Icon name="minus" />
      </button>
      <output
        aria-live="polite"
        className="flex min-w-[2.2em] items-center justify-center border-x border-line text-control font-bold tabular-nums"
      >
        {count}
      </output>
      <button
        type="button"
        className={stepButton}
        disabled={count >= max}
        onClick={() => step(1)}
        aria-label={content.more(label)}
      >
        <Icon name="plus" />
      </button>
    </div>
  );
}
