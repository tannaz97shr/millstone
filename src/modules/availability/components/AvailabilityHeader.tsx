"use client";

import { DatePicker } from "@/shared/components/molecules/DatePicker/DatePicker";
import { FilterButtons } from "@/shared/components/molecules/FilterButtons/FilterButtons";
import type { BranchId, IsoDate } from "@/shared/domain";
import { addDays, formatPickupDay, formatTimeOfDay } from "@/shared/utils/pickup-dates";
import { availabilityContent } from "../content/availabilityContent";
import type { AvailabilityBranchOption, AvailabilityCalendar } from "../types/availability";

const content = availabilityContent;

export interface AvailabilityHeaderProps {
  branchName: string;
  /** Owner only: every branch, as buttons. */
  branches: AvailabilityBranchOption[] | null;
  branchId: BranchId;
  onBranchChange: (branchId: BranchId) => void;
  calendar: AvailabilityCalendar;
  date: IsoDate;
  onDateChange: (date: IsoDate) => void;
}

/** Why the picker starts where it does, then how long sold out lasts. */
function pickerNote(calendar: AvailabilityCalendar): string {
  const day = formatPickupDay(calendar.earliest);
  const cutoff = formatTimeOfDay(calendar.cutoffTime);
  const why = calendar.pastTodaysCutoff
    ? content.picker.earliestAfterCutoff(day, cutoff)
    : calendar.earliest === addDays(calendar.today, 1)
      ? content.picker.earliestTomorrow(day, cutoff)
      : content.picker.earliest(day);
  return `${why} ${content.picker.lasts}`;
}

/** A4's top band: the title, the owner's branch buttons and the "Mark sold out for" days. */
export function AvailabilityHeader({
  branchName,
  branches,
  branchId,
  onBranchChange,
  calendar,
  date,
  onDateChange,
}: AvailabilityHeaderProps) {
  return (
    <section
      aria-label={content.regionLabel}
      className="flex flex-col gap-5 border-b-2 border-line px-8 pt-6 pb-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="flex flex-col gap-1">
          <h1 className="admin-title">{content.title(branchName)}</h1>
          <p className="max-w-155 text-[18px]/[26px] text-ink-muted">{content.intro}</p>
        </div>
        {branches && (
          <FilterButtons
            label={content.branchLabel}
            options={branches.map((branch) => ({ value: branch.id, label: branch.name }))}
            value={branchId}
            onChange={onBranchChange}
          />
        )}
      </div>
      <DatePicker
        label={content.picker.label}
        value={date}
        onChange={onDateChange}
        earliest={calendar.earliest}
        latest={addDays(calendar.earliest, calendar.days - 1)}
        start={calendar.earliest}
        days={calendar.days}
        closedWeekdays={calendar.closedWeekdays}
        today={calendar.today}
        note={pickerNote(calendar)}
      />
    </section>
  );
}
