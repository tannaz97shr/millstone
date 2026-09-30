import { z } from "zod";

const seedEnvSchema = z.object({
  SEED_STAFF_PASSWORD: z.string().min(8, "must be at least 8 characters"),
  SEED_CUSTOMER_PASSWORD: z.string().min(8, "must be at least 8 characters"),
});

export type SeedEnv = z.infer<typeof seedEnvSchema>;

export function readSeedEnv(source: NodeJS.ProcessEnv = process.env): SeedEnv {
  const result = seedEnvSchema.safeParse(source);
  if (!result.success) {
    // Names and reasons only, never values.
    const problems = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Seed passwords are not configured in .env.local. ${problems}`);
  }
  return result.data;
}
