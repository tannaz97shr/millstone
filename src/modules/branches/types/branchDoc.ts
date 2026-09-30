import type { z } from "zod";
import type { branchDocSchema } from "../lib/branchSchema";

export type BranchDoc = z.input<typeof branchDocSchema>;
