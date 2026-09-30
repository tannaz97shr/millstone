import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import type { IsoDate, IsoInstant, TimeOfDay, Weekday } from "@/shared/domain";
import { isIsoDate, isTimeOfDay } from "@/shared/utils/pickup-dates";

// Zod building blocks for stored Firestore fields, shared by every module's
// doc schema so dates, times and money are validated the same way everywhere.

export const isoDateField = z
  .string()
  .refine(isIsoDate, { message: 'expected "YYYY-MM-DD"' })
  .transform((value) => value as IsoDate);

export const timeOfDayField = z
  .string()
  .refine(isTimeOfDay, { message: 'expected "HH:mm"' })
  .transform((value) => value as TimeOfDay);

export const weekdayField = z
  .number()
  .int()
  .min(0)
  .max(6)
  .transform((value) => value as Weekday);

export const timestampField = z.instanceof(Timestamp);

export const centsField = z.number().int().nonnegative();

export const emailField = z.email().refine((value) => value === normalizeEmail(value), {
  message: "expected a lowercased, trimmed email",
});

/** Digits only, e.g. "0491570156". */
export const phoneField = z.string().regex(/^\d{8,12}$/, "expected digits only");

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function timestampToIso(timestamp: Timestamp): IsoInstant {
  return timestamp.toDate().toISOString() as IsoInstant;
}

export function optionalTimestampToIso(timestamp: Timestamp | null): IsoInstant | null {
  return timestamp ? timestampToIso(timestamp) : null;
}
