"use client";

import { useEffect, useRef, useState } from "react";
import type { IsoDate, Weekday } from "@/shared/domain";
import { componentsContent } from "@/shared/content/components";
import { cx } from "@/shared/utils/cx";
import {
  addDays,
  addMonths,
  dayOfMonth,
  daysInMonth,
  formatLongDay,
  formatMonthTitle,
  startOfMonth,
  weekdayName,
  weekdayOf,
} from "@/shared/utils/pickup-dates";
import { Icon } from "../../atoms/Icon/Icon";

export interface MonthGridProps {
  selected: IsoDate | null;
  /** The day the grid opens on when nothing is selected. */
  initialDate: IsoDate;
  /** Outlined, so staff can find "today" at a glance. */
  today?: IsoDate;
  isOff: (date: IsoDate) => boolean;
  onPick: (date: IsoDate) => void;
}

const content = componentsContent.datePicker;
const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

const navButton =
  "flex size-tap shrink-0 cursor-pointer items-center justify-center rounded-md text-[calc(var(--control-text)+4px)] text-crust hover:bg-crust-soft";

/**
 * A month of days. The grid is one tab stop: arrows move a day or a week,
 * Home and End go to the start and end of the week, PageUp and PageDown change
 * month, Enter or Space picks. Unavailable days can be reached so they are
 * announced, but can't be picked.
 */
export function MonthGrid({ selected, initialDate, today, isOff, onPick }: MonthGridProps) {
  const grid = useRef<HTMLDivElement>(null);
  const focusAfterRender = useRef(false);
  const [focusDate, setFocusDate] = useState<IsoDate>(selected ?? initialDate);
  const [month, setMonth] = useState<IsoDate>(() => startOfMonth(selected ?? initialDate));

  useEffect(() => {
    if (!focusAfterRender.current) return;
    focusAfterRender.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`)?.focus();
  }, [focusDate]);

  const moveTo = (date: IsoDate) => {
    focusAfterRender.current = true;
    setFocusDate(date);
    setMonth(startOfMonth(date));
  };

  const onKeyDown = (event: React.KeyboardEvent, date: IsoDate) => {
    const targets: Record<string, () => IsoDate> = {
      ArrowLeft: () => addDays(date, -1),
      ArrowRight: () => addDays(date, 1),
      ArrowUp: () => addDays(date, -7),
      ArrowDown: () => addDays(date, 7),
      Home: () => addDays(date, -weekdayOf(date)),
      End: () => addDays(date, 6 - weekdayOf(date)),
      PageUp: () => addMonths(date, -1),
      PageDown: () => addMonths(date, 1),
    };
    const target = targets[event.key];
    if (!target) return;
    event.preventDefault();
    moveTo(target());
  };

  const days = Array.from({ length: daysInMonth(month) }, (_, i) => addDays(month, i));
  // The one day Tab lands on: the last focused day, or the 1st after changing month by button.
  const tabStop = startOfMonth(focusDate) === month ? focusDate : month;

  return (
    <div className="max-w-105 rounded-lg border border-line bg-flour-raised p-3 admin:max-w-130 admin:p-5">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          className={navButton}
          aria-label={content.previousMonth}
          onClick={() => setMonth(addMonths(month, -1))}
        >
          <Icon name="left" />
        </button>
        <span
          aria-live="polite"
          className="font-serif text-[calc(var(--control-text)+2px)] font-bold"
        >
          {formatMonthTitle(month)}
        </span>
        <button
          type="button"
          className={navButton}
          aria-label={content.nextMonth}
          onClick={() => setMonth(addMonths(month, 1))}
        >
          <Icon name="right" />
        </button>
      </div>
      <div ref={grid} className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            aria-hidden="true"
            className="py-1 text-center text-hint font-bold text-ink-muted"
          >
            {weekdayName(weekday).slice(0, 2)}
          </span>
        ))}
        {Array.from({ length: weekdayOf(month) }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {days.map((date) => {
          const off = isOff(date);
          const on = !off && date === selected;
          const isToday = date === today;
          const longDay = formatLongDay(date);
          return (
            <button
              key={date}
              type="button"
              data-date={date}
              tabIndex={date === tabStop ? 0 : -1}
              aria-pressed={on}
              aria-disabled={off || undefined}
              aria-current={isToday ? "date" : undefined}
              aria-label={off ? content.unavailable(longDay) : longDay}
              onClick={() => !off && onPick(date)}
              onFocus={() => setFocusDate(date)}
              onKeyDown={(event) => onKeyDown(event, date)}
              className={cx(
                "flex h-tap items-center justify-center rounded-md border-(length:--control-border) text-control tabular-nums",
                off && "cursor-not-allowed font-normal text-ink-muted line-through",
                on && "cursor-pointer border-crust bg-crust font-bold text-on-crust",
                !off && !on && "cursor-pointer font-bold hover:bg-crust-soft",
                !on && (isToday ? "border-line-strong" : "border-transparent"),
              )}
            >
              {dayOfMonth(date)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
