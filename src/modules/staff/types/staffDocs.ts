import type { z } from "zod";
import type { staffEmailLockSchema, staffUserDocSchema } from "../lib/staffUserSchema";

export type StaffUserDoc = z.input<typeof staffUserDocSchema>;
export type StaffEmailLockDoc = z.input<typeof staffEmailLockSchema>;
