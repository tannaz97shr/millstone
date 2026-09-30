import "server-only";
import { z } from "zod";

// Firebase settings from the environment. Service-account credentials are only
// required when not talking to the local emulator.

const firebaseEnvSchema = z
  .object({
    FIREBASE_PROJECT_ID: z.string().min(1),
    FIREBASE_STORAGE_BUCKET: z.string().min(1),
    FIRESTORE_EMULATOR_HOST: z.string().min(1).optional(),
    FIREBASE_STORAGE_EMULATOR_HOST: z.string().min(1).optional(),
    FIREBASE_CLIENT_EMAIL: z.string().min(1).optional(),
    FIREBASE_PRIVATE_KEY: z.string().min(1).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.FIRESTORE_EMULATOR_HOST) return;
    for (const key of ["FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"] as const) {
      if (!env[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "required when FIRESTORE_EMULATOR_HOST is not set",
        });
      }
    }
  });

export type FirebaseEnv = z.infer<typeof firebaseEnvSchema>;

export function readFirebaseEnv(source: NodeJS.ProcessEnv = process.env): FirebaseEnv {
  const result = firebaseEnvSchema.safeParse(source);
  if (!result.success) {
    // Names and reasons only, never values.
    const problems = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Firebase environment is not configured. ${problems}`);
  }
  return result.data;
}

export function isUsingEmulator(env: FirebaseEnv): boolean {
  return Boolean(env.FIRESTORE_EMULATOR_HOST);
}
