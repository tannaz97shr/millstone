"use client";

import type { BranchSummary } from "@/modules/branches/types/branchSummary";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { Card } from "@/shared/components/atoms/Card/Card";
import { DatePicker } from "@/shared/components/molecules/DatePicker/DatePicker";
import type { IsoDate } from "@/shared/domain";
import { routes } from "@/shared/routes";
import {
  addDays,
  formatPickupDay,
  formatTimeOfDay,
  formatWeekdayList,
} from "@/shared/utils/pickup-dates";
import { menuContent } from "../content/menuContent";

const content = menuContent.pickup;

export interface PickupCardProps {
  branch: BranchSummary;
  date: IsoDate | null;
  onPickDate: (date: IsoDate) => void;
}

/** The branch with Change, and the day strip with the cutoff rule under it. */
export function PickupCard({ branch, date, onPickDate }: PickupCardProps) {
  const { pickup } = branch;
  const stripDates = Array.from({ length: pickup.stripDays }, (_, i) => addDays(pickup.stripStart, i));
  // Belt and braces: the server's list decides, whatever the weekday rule says.
  const unavailable = stripDates.filter((d) => !pickup.orderableDates.includes(d));

  const cutoff = formatTimeOfDay(branch.orderCutoffTime);
  const closed = content.closed(formatWeekdayList(branch.closedDays));
  const note = pickup.pastTodaysCutoff
    ? content.afterCutoffNote(cutoff, formatPickupDay(pickup.earliest), closed)
    : content.cutoffNote(cutoff, closed);

  return (
    <Card as="section" aria-label={content.regionLabel} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="caption text-ink-muted">{content.from}</span>
          <span className="branch-name">{branch.name}</span>
        </div>
        <ButtonLink href={routes.home} aria-label={content.changeLabel(branch.name)}>
          {content.change}
        </ButtonLink>
      </div>
      <hr className="border-line" />
      <DatePicker
        label={content.dayLabel}
        value={date}
        onChange={onPickDate}
        earliest={pickup.earliest}
        start={pickup.stripStart}
        days={pickup.stripDays}
        closedWeekdays={branch.closedDays}
        unavailable={unavailable}
        note={note}
      />
    </Card>
  );
}
