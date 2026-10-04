import type { IsoInstant } from "@/shared/domain";
import { formatTimeOfDay } from "./formatDates";
import { melbourneDateOf, melbourneTimeOfDayOf } from "./melbourneTime";
import { formatPickupDay } from "./pickupDates";

// Instants as the admin shows them: always Melbourne time, whatever the
// tablet's or the server's time zone.

/** "9:41am" in Melbourne. */
export function formatMelbourneTime(instant: IsoInstant | Date): string {
  return formatTimeOfDay(melbourneTimeOfDayOf(new Date(instant)));
}

/** "8:05am Tue 29 Sep" in Melbourne: the A3 history and payment lines. */
export function formatMelbourneStamp(instant: IsoInstant | Date): string {
  const date = new Date(instant);
  return `${formatMelbourneTime(date)} ${formatPickupDay(melbourneDateOf(date))}`;
}
