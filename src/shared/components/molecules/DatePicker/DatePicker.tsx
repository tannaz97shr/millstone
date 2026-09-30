"use client";

import { useId } from "react";
import type { IsoDate, Weekday } from "@/shared/domain";
import { useControllableState } from "@/shared/hooks/useControllableState";
import { cx } from "@/shared/utils/cx";
import { addDays, weekdayOf } from "@/shared/utils/pickup-dates";
import { FieldHint } from "../../atoms/Field/FieldHint";
import { FieldLabel } from "../../atoms/Field/FieldLabel";
import { DayStrip } from "./DayStrip";
import { MonthGrid } from "./MonthGrid";

export interface DatePickerProps {
  /** Controlled value; null means controlled with nothing chosen yet. */
  value?: IsoDate | null;
  defaultValue?: IsoDate;
  onChange?: (date: IsoDate) => void;
  /** First orderable date. Work it out with the pickup-date helpers (branch cutoff) before passing it. */
  earliest?: IsoDate;
  latest?: IsoDate;
  /** Dates the branch is closed or the item is sold out. They stay visible, dashed and struck through. */
  unavailable?: IsoDate[];
  /** 0 = Sunday. */
  closedWeekdays?: Weekday[];
  /** strip: day tiles for customers. month: a grid for the admin filter and recurring start/end dates. */
  layout?: "strip" | "month";
  /** Strip only: the first tile. Defaults to `earliest`. */
  start?: IsoDate;
  /** Strip only: how many tiles. */
  days?: number;
  /** Today in Melbourne, from the pickup-date helpers. Outlined in the month grid. */
  today?: IsoDate;
  label?: React.ReactNode;
  /** One line under the picker; use it for the cutoff rule. */
  note?: React.ReactNode;
  className?: string;
}

/**
 * Picks one pickup date; no time slots. The component never reads the clock:
 * `earliest`, `start` and `today` come from the caller, so the server and the
 * browser always render the same days.
 */
export function DatePicker({
  value,
  defaultValue,
  onChange,
  earliest,
  latest,
  unavailable = [],
  closedWeekdays = [],
  layout = "strip",
  start,
  days = 7,
  today,
  label,
  note,
  className,
}: DatePickerProps) {
  const labelId = useId();
  const [selected, setSelected] = useControllableState<IsoDate | null>({
    value,
    defaultValue: defaultValue ?? null,
  });

  const anchor = start ?? earliest ?? today ?? selected ?? latest;
  if (!anchor) {
    throw new Error("DatePicker needs one of start, earliest, today or a value to know which days to show");
  }

  // "YYYY-MM-DD" strings compare in date order.
  const isOff = (date: IsoDate) =>
    (earliest !== undefined && date < earliest) ||
    (latest !== undefined && date > latest) ||
    unavailable.includes(date) ||
    closedWeekdays.includes(weekdayOf(date));

  const pick = (date: IsoDate) => {
    setSelected(date);
    onChange?.(date);
  };

  return (
    <div
      role="group"
      aria-labelledby={label ? labelId : undefined}
      className={cx("flex min-w-0 flex-col gap-2", className)}
    >
      {label && (
        <FieldLabel as="div" id={labelId}>
          {label}
        </FieldLabel>
      )}
      {layout === "month" ? (
        <MonthGrid
          selected={selected}
          // Open on today, unless ordering only starts later.
          initialDate={today && !(earliest && today < earliest) ? today : anchor}
          today={today}
          isOff={isOff}
          onPick={pick}
        />
      ) : (
        <DayStrip
          dates={Array.from({ length: days }, (_, i) => addDays(anchor, i))}
          selected={selected}
          isOff={isOff}
          onPick={pick}
        />
      )}
      {note && <FieldHint>{note}</FieldHint>}
    </div>
  );
}
