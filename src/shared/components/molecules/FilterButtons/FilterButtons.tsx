"use client";

import { useId } from "react";
import { cx } from "@/shared/utils/cx";
import { Button } from "../../atoms/Button/Button";
import { FieldLabel } from "../../atoms/Field/FieldLabel";

export interface FilterOption<Value extends string> {
  value: Value;
  label: React.ReactNode;
  /** On the button, so a screen can move focus to it. */
  id?: string;
  /** Defaults to `value === selected`; set it for an option that opens something, e.g. "Choose date". */
  pressed?: boolean;
}

export interface FilterButtonsProps<Value extends string> {
  /** Shown above the buttons and names the group, e.g. "Show". */
  label: React.ReactNode;
  options: FilterOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  className?: string;
}

// The pressed button is filled with ink (A2/A4 filters, A5 categories); the others stay secondary.
export const pressedClasses =
  "aria-pressed:border-ink! aria-pressed:bg-ink! aria-pressed:text-flour-raised! whitespace-nowrap";

/**
 * A labelled row of toggle buttons for a filter: one is pressed at a time.
 * Every option is a visible word (admin rule: no hidden menus).
 */
export function FilterButtons<Value extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: FilterButtonsProps<Value>) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className={cx("flex min-w-0 flex-col gap-2", className)}>
      <FieldLabel as="div" id={labelId}>
        {label}
      </FieldLabel>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            id={option.id}
            variant="secondary"
            aria-pressed={option.pressed ?? option.value === value}
            onClick={() => onChange(option.value)}
            className={pressedClasses}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
