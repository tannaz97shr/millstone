import type { IsoDate, TimeOfDay } from "@/shared/domain";
import { timeOfDayParts, toIsoDate } from "./calendarDate";

// Converting between instants and Melbourne wall-clock time with Intl only.
// Melbourne's UTC offset changes with daylight saving (+10 AEST / +11 AEDT),
// so it is always measured at the instant in question, never assumed.

export const BAKERY_TIME_ZONE = "Australia/Melbourne";

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const wallClockFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BAKERY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function melbourneWallClock(instant: Date): WallClock {
  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, number>> = {};
  for (const part of wallClockFormatter.formatToParts(instant)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return {
    year: parts.year ?? 0,
    month: parts.month ?? 0,
    day: parts.day ?? 0,
    hour: parts.hour ?? 0,
    minute: parts.minute ?? 0,
    second: parts.second ?? 0,
  };
}

/** Melbourne's offset from UTC, in ms, at the given instant. */
function melbourneOffsetMs(instant: Date): number {
  const wall = melbourneWallClock(instant);
  const wallAsUtc = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second,
  );
  const wholeSeconds = Math.floor(instant.getTime() / 1000) * 1000;
  return wallAsUtc - wholeSeconds;
}

/** The Melbourne calendar date at the given instant. */
export function melbourneDateOf(instant: Date): IsoDate {
  const { year, month, day } = melbourneWallClock(instant);
  const pad = (n: number) => String(n).padStart(2, "0");
  return toIsoDate(`${year}-${pad(month)}-${pad(day)}`);
}

/** The instant when Melbourne clocks show `time` on `date`. */
export function melbourneWallTimeToInstant(date: IsoDate, time: TimeOfDay): Date {
  const [y, m, d] = date.split("-").map(Number);
  const { hour, minute } = timeOfDayParts(time);
  const wallAsUtc = Date.UTC(y, m - 1, d, hour, minute);

  // First guess uses the offset at the wall time read as UTC; the second pass
  // corrects it when a daylight-saving change falls between the two.
  const firstGuess = wallAsUtc - melbourneOffsetMs(new Date(wallAsUtc));
  const corrected = wallAsUtc - melbourneOffsetMs(new Date(firstGuess));
  return new Date(corrected);
}
