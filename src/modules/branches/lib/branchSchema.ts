import "server-only";
import { z } from "zod";
import { phoneField, timeOfDayField, weekdayField } from "@/shared/lib/firebase/fieldSchemas";

/** Stored shape of branches/{branchId}. The doc ID is the branch slug. */
export const branchDocSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  phone: phoneField,
  orderCutoffTime: timeOfDayField,
  opensAt: timeOfDayField,
  closedDays: z
    .array(weekdayField)
    .max(6, "a branch must be open at least one day")
    .refine((days) => new Set(days).size === days.length, "closed days must be unique"),
  notificationsEnabled: z.boolean(),
  displayOrder: z.number().int().nonnegative(),
});
