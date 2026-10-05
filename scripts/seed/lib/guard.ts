import type { FirebaseEnv } from "@/shared/lib/firebase/env";
import { LIVE_PROJECT_ID, setEmulatorVars } from "@/shared/lib/firebase/firebaseTarget";

// The seed and the migrations write data, so they only run against the local
// emulator (a "demo-" project that can't exist in the cloud) or the live
// project named on purpose with --project. `--reset` wipes everything, so it
// only ever runs on the emulator.

export interface SeedTarget {
  projectId: string;
  emulatorHost: string | null;
  reset: boolean;
}

const DEMO_PROJECT_PREFIX = "demo-";

/** Real projects the seed and migrations may write to (never wipe): the live project only. */
export const LIVE_PROJECTS_SEEDABLE: readonly string[] = [LIVE_PROJECT_ID];

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
          "(bun run emulators), or pass --project=<id> to seed the live project on purpose.",
      );
    }
    if (!projectId.startsWith(DEMO_PROJECT_PREFIX)) {
      throw new Error(
        `Refusing to seed: emulator runs should use a "${DEMO_PROJECT_PREFIX}" project ID, got "${projectId}".`,
      );
    }
    return { projectId, emulatorHost: env.FIRESTORE_EMULATOR_HOST, reset };
  }

  if (reset) {
    throw new Error(
      `Refusing to reset: ${projectFlag || "(empty)"} is a real project. --reset only runs on the emulator.`,
    );
  }
  const emulatorVars = setEmulatorVars(rawEnv);
  if (emulatorVars.length > 0) {
    throw new Error(
      `Refusing to seed: --project=${projectFlag} was given, but ${emulatorVars.join(", ")} is set. ` +
        "Use the live env file only (bun run seed:live).",
    );
  }
  if (!LIVE_PROJECTS_SEEDABLE.includes(projectFlag)) {
    throw new Error(`Refusing to seed: ${projectFlag || "(empty)"} isn't the live project.`);
  }
  if (projectFlag !== projectId) {
    throw new Error(
      `Refusing to seed: --project=${projectFlag} doesn't match FIREBASE_PROJECT_ID (${projectId}).`,
    );
  }
  return { projectId, emulatorHost: null, reset: false };
}
