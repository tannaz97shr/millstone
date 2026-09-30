"use client";

import { useRef, useState } from "react";
import type { IsoDate } from "@/shared/domain";
import { componentsContent } from "@/shared/content/components";
import { cx } from "@/shared/utils/cx";
import {
  dayOfMonth,
  formatLongDay,
  monthShortName,
  weekdayName,
  weekdayOf,
} from "@/shared/utils/pickup-dates";

export interface DayStripProps {
  dates: IsoDate[];
  selected: IsoDate | null;
  isOff: (date: IsoDate) => boolean;
  onPick: (date: IsoDate) => void;
}

const content = componentsContent.datePicker;

/**
 * The customer's day tiles. One tab stop: arrow keys, Home and End move
 * between tiles, Enter or Space picks. Unavailable days stay focusable so
 * they are announced, but can't be picked.
 */
export function DayStrip({ dates, selected, isOff, onPick }: DayStripProps) {
  const tiles = useRef<Array<HTMLButtonElement | null>>([]);
  const [active, setActive] = useState(() => {
    const chosen = selected ? dates.indexOf(selected) : -1;
    if (chosen >= 0) return chosen;
    const firstOpen = dates.findIndex((date) => !isOff(date));
    return Math.max(firstOpen, 0);
  });

  const moveTo = (index: number) => {
    const next = Math.max(0, Math.min(dates.length - 1, index));
    setActive(next);
    tiles.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const targets: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: dates.length - 1,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    moveTo(targets[event.key]);
  };

  return (
    <div className="-m-1 flex snap-x snap-proximity gap-2 overflow-x-auto p-1 pb-2">
      {dates.map((date, index) => {
        const off = isOff(date);
        const on = !off && date === selected;
        const longDay = formatLongDay(date);
        return (
          <button
            key={date}
            ref={(element) => {
              tiles.current[index] = element;
            }}
            type="button"
            data-date={date}
            tabIndex={index === active ? 0 : -1}
            aria-pressed={on}
            aria-disabled={off || undefined}
            aria-label={off ? content.unavailable(longDay) : longDay}
            onClick={() => !off && onPick(date)}
            onFocus={() => setActive(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cx(
              "flex min-h-[calc(var(--control-h)+28px)] w-[calc(var(--control-h)+16px)] shrink-0 snap-start flex-col items-center justify-center rounded-md border-(length:--control-border) text-center",
              off && "cursor-not-allowed border-dashed border-line bg-transparent text-ink-muted",
              on && "cursor-pointer border-crust bg-crust text-on-crust",
              !off && !on && "cursor-pointer border-line-strong bg-flour-raised hover:bg-crust-soft",
            )}
          >
            <span
              className={cx(
                "text-hint leading-[1.2] font-bold tracking-[0.06em] uppercase",
                !on && "text-ink-muted",
              )}
            >
              {weekdayName(weekdayOf(date))}
            </span>
            <span
              className={cx(
                "font-serif text-[calc(var(--control-text)+8px)] leading-[1.1] font-bold",
                off && "line-through decoration-2",
              )}
            >
              {dayOfMonth(date)}
            </span>
            <span className={cx("text-hint leading-[1.2]", !on && "text-ink-muted")}>
              {monthShortName(date)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
