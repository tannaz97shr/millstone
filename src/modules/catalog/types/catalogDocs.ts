import type { z } from "zod";
import type { branchProductDocSchema } from "../lib/branchProductSchema";
import type { catalogSettingsDocSchema } from "../lib/catalogSettingsSchema";
import type { productDocSchema } from "../lib/productSchema";

export type ProductDoc = z.input<typeof productDocSchema>;
export type BranchProductDoc = z.input<typeof branchProductDocSchema>;
export type CatalogSettingsDoc = z.input<typeof catalogSettingsDocSchema>;
