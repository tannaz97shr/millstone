import "server-only";
import { z } from "zod";

/** Stored shape of settings/catalog. */
export const catalogSettingsDocSchema = z.object({
  categoryOrder: z
    .array(z.string().min(1))
    .refine((names) => new Set(names).size === names.length, "category names must be unique"),
});
