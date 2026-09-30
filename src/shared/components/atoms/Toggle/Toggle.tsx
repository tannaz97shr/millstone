"use client";

import { componentsContent } from "@/shared/content/components";
import { useControllableState } from "@/shared/hooks/useControllableState";
import { cx } from "@/shared/utils/cx";

export interface ToggleProps {
  label?: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (on: boolean) => void;
  /** Say what "on" means, e.g. "On the menu". */
  onText?: string;
  offText?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * An on/off switch that takes effect immediately, with its state written out
 * beside it. Position, fill and the words all change, never colour alone.
 */
export function Toggle({
  label,
  checked,
  defaultChecked = false,
  onChange,
  onText = componentsContent.toggle.on,
  offText = componentsContent.toggle.off,
  disabled = false,
  className,
}: ToggleProps) {
  const [on, setOn] = useControllableState({ value: checked, defaultValue: defaultChecked, onChange });

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => setOn(!on)}
      className={cx(
        "group inline-flex min-h-tap cursor-pointer items-center gap-3 text-left text-control text-ink",
        "focus-visible:shadow-none disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "relative h-toggle-h w-toggle-w shrink-0 rounded-full border-(length:--control-border) transition-colors duration-150",
          "group-focus-visible:shadow-focus-ring",
          on ? "border-crust bg-crust" : "border-line-strong bg-flour-sunk",
        )}
      >
        <span
          className={cx(
            "absolute top-1/2 size-[calc(var(--toggle-h)-10px)] -translate-y-1/2 rounded-full border-(length:--control-border) transition-[left] duration-150",
            on
              ? "left-[calc(100%-var(--toggle-h)+7px)] border-on-crust bg-on-crust"
              : "left-[3px] border-line-strong bg-flour-raised",
          )}
        />
      </span>
      <span className="flex flex-col">
        {label && <span className="font-bold">{label}</span>}
        <span className={cx("text-hint", on ? "font-bold text-crust" : "text-ink-muted")}>
          {on ? onText : offText}
        </span>
      </span>
    </button>
  );
}
