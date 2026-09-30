"use client";

import { useId } from "react";
import { useControllableState } from "@/shared/hooks/useControllableState";
import { cx } from "@/shared/utils/cx";
import { FieldError } from "../../atoms/Field/FieldError";
import { FieldLabel } from "../../atoms/Field/FieldLabel";

export interface ChoiceOption {
  value: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
}

export interface ChoiceGroupProps {
  /** The question, written as a question. */
  label?: React.ReactNode;
  /** Two to four options. */
  options: ChoiceOption[];
  /** Controlled value; null means controlled with nothing chosen yet. */
  value?: string | null;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  /** A sentence that says what to do, e.g. "Choose how you'd like to pay." */
  error?: React.ReactNode;
  className?: string;
}

/**
 * Large radio cards. Native radios keep arrow-key and Space behaviour; the
 * whole card is the tap target.
 */
export function ChoiceGroup({
  label,
  options,
  value,
  defaultValue,
  onChange,
  name,
  error,
  className,
}: ChoiceGroupProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const [selected, setSelected] = useControllableState<string | null>({
    value,
    defaultValue: defaultValue ?? null,
  });
  const choose = (next: string) => {
    setSelected(next);
    onChange?.(next);
  };

  return (
    <fieldset
      aria-describedby={error ? errorId : undefined}
      className={cx("m-0 flex min-w-0 flex-col gap-2 border-0 p-0", className)}
    >
      {label && (
        <FieldLabel as="legend" className="mb-2">
          {label}
        </FieldLabel>
      )}
      {options.map((option) => {
        const on = option.value === selected;
        return (
          <label
            key={option.value}
            className={cx(
              "relative flex min-h-control cursor-pointer items-start gap-3 rounded-md border-(length:--control-border) px-4 py-3",
              "has-focus-visible:shadow-focus-ring",
              on
                ? "border-crust bg-crust-soft shadow-[inset_0_0_0_1px_var(--color-crust)]"
                : "border-line-strong bg-flour-raised",
            )}
          >
            <input
              type="radio"
              name={name ?? id}
              value={option.value}
              checked={on}
              onChange={() => choose(option.value)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={cx(
                "mt-px size-5.5 shrink-0 rounded-full bg-flour-raised",
                on ? "border-7 border-crust bg-on-crust" : "border-2 border-line-strong",
              )}
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-control font-bold">{option.label}</span>
              {option.hint && <span className="text-hint text-ink-muted">{option.hint}</span>}
            </span>
          </label>
        );
      })}
      <FieldError id={errorId} error={error} />
    </fieldset>
  );
}
