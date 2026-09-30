"use client";

import { useId } from "react";
import type { Weekday } from "@/shared/domain";
import { componentsContent } from "@/shared/content/components";
import { useControllableState } from "@/shared/hooks/useControllableState";
import { cx } from "@/shared/utils/cx";
import { weekdayName } from "@/shared/utils/pickup-dates";
import { FieldError } from "../../atoms/Field/FieldError";
import { FieldHint } from "../../atoms/Field/FieldHint";
import { FieldLabel } from "../../atoms/Field/FieldLabel";

export interface WeekdayPickerProps {
  /** Selected weekdays, 0 = Sunday … 6 = Saturday (the same numbers as DatePicker's closedWeekdays). */
  value?: Weekday[];
  defaultValue?: Weekday[];
  /** Days come back in display order, so they can be saved as they are. */
  onChange?: (days: Weekday[]) => void;
  /** Days the branch is closed: shown dashed with the closed word, can't be picked. */
  closedWeekdays?: Weekday[];
  /** Tile order. Monday first by default. */
  order?: Weekday[];
  /** Word under a closed day. */
  closedText?: string;
  label?: React.ReactNode;
  /** The rule that matters, e.g. "Choose one or more. We make each order at 2pm the day before." */
  hint?: React.ReactNode;
  /** Says what to do: "Choose at least one day." */
  error?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const MONDAY_FIRST: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
const content = componentsContent.weekdayPicker;

/** Pick one or more days of the week, as tiles that match the DatePicker's day strip. */
export function WeekdayPicker({
  value,
  defaultValue = [],
  onChange,
  closedWeekdays = [],
  order = MONDAY_FIRST,
  closedText = content.closed,
  label,
  hint,
  error,
  disabled = false,
  className,
}: WeekdayPickerProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const [selected, setSelected] = useControllableState({ value, defaultValue, onChange });

  const toggle = (day: Weekday) => {
    const next = selected.includes(day) ? selected.filter((d) => d !== day) : [...selected, day];
    setSelected(order.filter((d) => next.includes(d)));
  };

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      {label && (
        <FieldLabel as="div" id={labelId}>
          {label}
        </FieldLabel>
      )}
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
      <div
        role="group"
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={
          [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined
        }
        className="grid grid-cols-4 gap-2 admin:gap-3 admin:md:grid-cols-7"
      >
        {order.map((day) => {
          const closed = closedWeekdays.includes(day);
          const on = !closed && selected.includes(day);
          const longName = weekdayName(day, "long");
          return (
            <button
              key={day}
              type="button"
              aria-pressed={on}
              disabled={closed || disabled}
              aria-label={closed ? content.closedLabel(longName, closedText) : longName}
              onClick={() => toggle(day)}
              className={cx(
                "flex min-h-[calc(var(--control-h)+8px)] flex-col items-center justify-center rounded-md border-(length:--control-border) p-1 text-control leading-tight font-bold",
                "cursor-pointer disabled:cursor-not-allowed disabled:border-dashed disabled:border-line disabled:bg-transparent disabled:text-ink-muted",
                on
                  ? "border-crust bg-crust text-on-crust"
                  : cx(
                      "bg-flour-raised text-ink enabled:hover:bg-crust-soft",
                      error ? "border-brick" : "border-line-strong",
                    ),
              )}
            >
              <span>{weekdayName(day)}</span>
              {closed && <span className="text-hint font-normal">{closedText}</span>}
            </button>
          );
        })}
      </div>
      <FieldError id={errorId} error={error} />
    </div>
  );
}
