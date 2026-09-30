"use client";

import { useState } from "react";
import type { IsoDate, Weekday } from "@/shared/domain";
import { DatePicker } from "@/shared/components/molecules/DatePicker/DatePicker";
import { WeekdayPicker } from "@/shared/components/molecules/WeekdayPicker/WeekdayPicker";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { devComponentsContent } from "../../content/devComponents";
import type { SampleDates } from "../../lib/sampleData";

const content = devComponentsContent;

function ValueReadout({ value }: { value: string }) {
  return (
    <p className="caption text-ink-muted">
      {content.valueLabel}: <span data-testid="controlled-value">{value}</span>
    </p>
  );
}

export interface ControlledWeekdayPickerProps {
  closedWeekdays: Weekday[];
  initial?: Weekday[];
  /** Show the error until at least one day is chosen. */
  requireChoice?: boolean;
}

export function ControlledWeekdayPicker({
  closedWeekdays,
  initial = [],
  requireChoice = false,
}: ControlledWeekdayPickerProps) {
  const [days, setDays] = useState<Weekday[]>(initial);
  const copy = content.weekdayPicker;
  return (
    <div className="flex flex-col gap-2">
      <WeekdayPicker
        label={copy.label}
        hint={copy.hint}
        value={days}
        onChange={setDays}
        closedWeekdays={closedWeekdays}
        error={requireChoice && days.length === 0 ? copy.error : undefined}
      />
      <ValueReadout value={days.join(",") || content.datePicker.none} />
    </div>
  );
}

export interface ControlledDatePickerProps {
  dates: SampleDates;
  layout: "strip" | "month";
}

export function ControlledDatePicker({ dates, layout }: ControlledDatePickerProps) {
  const [date, setDate] = useState<IsoDate | null>(layout === "strip" ? dates.chosen : null);
  const copy = content.datePicker;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {layout === "strip" ? (
        <DatePicker
          label={copy.stripLabel}
          note={copy.stripNote}
          value={date}
          onChange={setDate}
          earliest={dates.earliest}
          closedWeekdays={dates.closedWeekdays}
        />
      ) : (
        <DatePicker
          layout="month"
          label={copy.monthLabel}
          note={copy.monthNote}
          value={date}
          onChange={setDate}
          earliest={dates.monthStart}
          today={dates.today}
          closedWeekdays={dates.closedWeekdays}
        />
      )}
      <p className="caption text-ink-muted">
        {content.valueLabel}:{" "}
        <span data-testid="controlled-value" data-value={date ?? ""}>
          {date ? formatPickupDay(date) : copy.none}
        </span>
      </p>
    </div>
  );
}
