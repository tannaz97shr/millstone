import { z } from "zod";
import type { BranchId, IsoDate } from "@/shared/domain";
import { isIsoDate } from "@/shared/utils/pickup-dates";

// URL params shared by the API routes and the menu page. Branch IDs are slugs.

export const branchIdParam = z
  .string()
  .regex(/^[a-z0-9-]{1,64}$/, "expected a branch slug")
  .transform((value) => value as BranchId);

export const pickupDateParam = z
  .string()
  .refine(isIsoDate, 'expected "YYYY-MM-DD"')
  .transform((value) => value as IsoDate);

export const branchRouteParamsSchema = z.object({ branchId: branchIdParam });
export const menuSearchParamsSchema = z.object({ date: pickupDateParam });
