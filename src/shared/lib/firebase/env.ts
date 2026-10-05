import "server-only";
import { z } from "zod";
import { isStagingTarget, setEmulatorVars, STAGING_MARKER } from "./firebaseTarget";

// Firebase settings from the environment. Credentials are only required when
// not talking to the local emulator: either a service-account file
// (GOOGLE_APPLICATION_CREDENTIALS, for local staging runs) or its email and
// key as variables (for a host).

/** An empty value counts as unset: `dev:staging` blanks the emulator variables that way. */
const optionalText = z.preprocess((value) => (value === "" ? undefined : value), z.string().min(1).optional());

const firebaseEnvSchema = z
  .object({
    FIREBASE_PROJECT_ID: z.string().min(1),
    FIREBASE_STORAGE_BUCKET: z.string().min(1),
    FIRESTORE_EMULATOR_HOST: optionalText,
    FIREBASE_STORAGE_EMULATOR_HOST: optionalText,
    FIREBASE_CLIENT_EMAIL: optionalText,
    FIREBASE_PRIVATE_KEY: optionalText,
    GOOGLE_APPLICATION_CREDENTIALS: optionalText,
    [STAGING_MARKER]: optionalText,
  })
  .superRefine((env, ctx) => {
    // Staging mode must never reach an emulator, whatever .env.local says.
    const staging = isStagingTarget(env);
    if (staging) {
      for (const name of setEmulatorVars(env)) {
        ctx.addIssue({ code: "custom", path: [name], message: "must not be set in staging mode" });
      }
    }
    if ((env.FIRESTORE_EMULATOR_HOST && !staging) || env.GOOGLE_APPLICATION_CREDENTIALS) return;
    for (const key of ["FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"] as const) {
      if (!env[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "required when neither FIRESTORE_EMULATOR_HOST nor GOOGLE_APPLICATION_CREDENTIALS is set",
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

/** One line naming the backend, never a value other than the (public) project ID. */
export function describeBackend(env: FirebaseEnv): string {
  return isUsingEmulator(env) ? "Firebase: emulator" : `Firebase: project ${env.FIREBASE_PROJECT_ID}`;
}
