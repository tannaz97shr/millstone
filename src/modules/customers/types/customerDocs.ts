import type { z } from "zod";
import type { customerDocSchema, customerEmailLockSchema } from "../lib/customerSchema";

export type CustomerDoc = z.input<typeof customerDocSchema>;
export type CustomerEmailLockDoc = z.input<typeof customerEmailLockSchema>;
