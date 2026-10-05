import type { FirebaseEnv } from "@/shared/lib/firebase/env";
import { setEmulatorVars } from "@/shared/lib/firebase/firebaseTarget";

// The seed and the migrations write and can wipe data, so they only run
// against the local emulator (a "demo-" project that can't exist in the cloud)
// or a real project named on purpose with --project and on the list below.

export interface SeedTarget {
  projectId: string;
  emulatorHost: string | null;
  reset: boolean;
}

const DEMO_PROJECT_PREFIX = "demo-";

/**
 * Real projects the seed may write to and wipe. Staging only: production must
 * never be added here, since `--reset` deletes every document and product photo.
 */
export const REAL_PROJECTS_ALLOWED: readonly string[] = ["millstone-dc47f"];

export function resolveSeedTarget(
  argv: string[],
  env: FirebaseEnv,
  rawEnv: Record<string, string | undefined>,
): SeedTarget {
  const reset = argv.includes("--reset");
  const projectFlag = argv.find((arg) => arg.startsWith("--project="))?.split("=")[1];
  const projectId = env.FIREBASE_PROJECT_ID;

  if (rawEnv.NODE_ENV === "production") {
    throw new Error("Refusing to seed: NODE_ENV is production.");
  }

  if (projectFlag === undefined) {
    if (!env.FIRESTORE_EMULATOR_HOST) {
      throw new Error(
        "Refusing to seed: FIRESTORE_EMULATOR_HOST is not set. Start the emulator " +
          "(bun run emulators), or pass --project=<id> to seed a real staging project on purpose.",
      );
    }
    if (!projectId.startsWith(DEMO_PROJECT_PREFIX)) {
      throw new Error(
        `Refusing to seed: emulator runs should use a "${DEMO_PROJECT_PREFIX}" project ID, got "${projectId}".`,
      );
    }
    return { projectId, emulatorHost: env.FIRESTORE_EMULATOR_HOST, reset };
  }

  const emulatorVars = setEmulatorVars(rawEnv);
  if (emulatorVars.length > 0) {
    throw new Error(
      `Refusing to seed: --project=${projectFlag} was given, but ${emulatorVars.join(", ")} is set. ` +
        "Use the staging env file only (bun run seed:staging).",
    );
  }
  if (!REAL_PROJECTS_ALLOWED.includes(projectFlag)) {
    throw new Error(`Refusing to seed: ${projectFlag || "(empty)"} isn't an allowed staging project.`);
  }
  if (projectFlag !== projectId) {
    throw new Error(
      `Refusing to seed: --project=${projectFlag} doesn't match FIREBASE_PROJECT_ID (${projectId}).`,
    );
  }
  return { projectId, emulatorHost: null, reset };
}
